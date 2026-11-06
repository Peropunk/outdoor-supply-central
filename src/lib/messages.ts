import "server-only";
import { sendEmail } from "./email";
import { siteUrl } from "./site";
import { photoUrl } from "./supabase/config";
import { createAdminClient } from "./supabase/server";

// "Report a problem" threads (decision 2): one conversation per order for the
// buyer, the seller and Outdoor Supply Central. Only those three can read or
// write it (row level security on order_messages).

export type ThreadMessage = {
  id: string;
  authorName: string;
  side: "buyer" | "seller" | "admin";
  mine: boolean;
  body: string;
  photos: string[];
  at: string;
};

type OrderParties = { id: string; number: string; buyer_id: string; seller_id: string };

/** The thread, oldest first, with each author labelled as buyer, seller or Outdoor Supply Central. */
export async function getThread(order: OrderParties, viewerId: string): Promise<ThreadMessage[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("order_messages")
    .select("id, author_id, body, photo_paths, created_at")
    .eq("order_id", order.id)
    .order("created_at");
  const rows = data ?? [];
  const authorIds = [...new Set(rows.map((r) => r.author_id as string))];
  const { data: profiles } = authorIds.length
    ? await admin.from("profiles").select("id, display_name").in("id", authorIds)
    : { data: [] };
  const names = new Map((profiles ?? []).map((p) => [p.id as string, (p.display_name as string) || ""]));

  return rows.map((r) => {
    const side = r.author_id === order.buyer_id ? "buyer" : r.author_id === order.seller_id ? "seller" : "admin";
    return {
      id: r.id,
      side,
      mine: r.author_id === viewerId,
      authorName:
        side === "admin"
          ? "Outdoor Supply Central"
          : `${names.get(r.author_id) || (side === "buyer" ? "Buyer" : "Seller")} (${side})`,
      body: r.body,
      photos: ((r.photo_paths as string[]) ?? []).map(photoUrl),
      at: r.created_at,
    };
  });
}

async function emailsOf(userIds: string[]) {
  const admin = createAdminClient();
  const found = await Promise.all(userIds.map((id) => admin.auth.admin.getUserById(id)));
  return found.map((f) => f.data?.user?.email).filter((e): e is string => Boolean(e));
}

/** Everyone with the admin role. ADMIN_ALERT_EMAIL adds an inbox, such as a shared support address. */
export async function adminEmails() {
  const { data } = await createAdminClient().from("profiles").select("id").eq("role", "admin");
  const emails = await emailsOf((data ?? []).map((p) => p.id as string));
  if (process.env.ADMIN_ALERT_EMAIL) emails.push(process.env.ADMIN_ALERT_EMAIL);
  return [...new Set(emails)];
}

/** Emails the other people on the thread: admins hear about every message, and buyer and seller about each other's. */
export async function notifyThread(order: OrderParties, authorId: string, title: string, body: string, first: boolean) {
  const fromAdmin = authorId !== order.buyer_id && authorId !== order.seller_id;
  const parties = [order.buyer_id, order.seller_id].filter((id) => id !== authorId);
  const [partyEmails, admins] = await Promise.all([emailsOf(parties), fromAdmin ? [] : adminEmails()]);
  const who = fromAdmin ? "Outdoor Supply Central" : authorId === order.buyer_id ? "The buyer" : "The seller";
  const link = `${siteUrl()}/orders/${order.number}/problem`;
  const excerpt = body.length > 600 ? `${body.slice(0, 600)}…` : body;

  await Promise.all([
    ...partyEmails.map((to) =>
      sendEmail({
        to,
        subject: first ? `A problem was reported on order ${order.number}` : `New message on order ${order.number}`,
        text: [`${who} wrote about ${title}:`, ``, excerpt, ``, `Reply here: ${link}`].join("\n"),
      }),
    ),
    ...admins.map((to) =>
      sendEmail({
        to,
        subject: `${first ? "Problem reported" : "New message"}: order ${order.number}`,
        text: [`${who} wrote about ${title}:`, ``, excerpt, ``, `Open the thread: ${link}`].join("\n"),
      }),
    ),
  ]);
}
