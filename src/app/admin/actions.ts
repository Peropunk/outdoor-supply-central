"use server";

import { revalidateTag, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { sendEmail } from "@/lib/email";
import { applyTracking, buyLabelForOrder, refundOrder, runOrderSweep } from "@/lib/fulfillment";
import { LISTINGS_TAG } from "@/lib/listings-db";
import { SETTINGS_TAG } from "@/lib/settings";
import { isShippoTest } from "@/lib/shippo";
import { siteUrl } from "@/lib/site";
import { createAdminClient } from "@/lib/supabase/server";

// Admin tools. Every action checks the admin role itself, because a server
// action can be called directly, not only from the admin pages.

/** Back to the page the admin was on, with a status message. */
function done(path: string, message: string): never {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}msg=${encodeURIComponent(message)}`);
}

function back(formData?: FormData, fallback = "/admin") {
  const to = String(formData?.get("back") ?? "");
  return to.startsWith("/admin") ? to : fallback;
}

async function emailOf(userId: string) {
  const { data } = await createAdminClient().auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

// Orders ----------------------------------------------------------------------

export async function adminRefund(orderId: string, formData?: FormData) {
  await requireAdmin();
  const result = await refundOrder(orderId, "admin");
  done(back(formData), result.ok ? "Refunded in full. The buyer and seller have been emailed." : result.error);
}

export async function adminRetryLabel(orderId: string, formData?: FormData) {
  await requireAdmin();
  done(
    back(formData),
    (await buyLabelForOrder(orderId, false))
      ? "USPS label bought and sent to the seller."
      : "The label still couldn't be bought. Check the seller's address and phone, and the server log.",
  );
}

/** Test mode only: pretends USPS scanned or delivered the package, to check the order flow end to end. */
export async function adminSimulateTracking(orderId: string, status: "TRANSIT" | "DELIVERED", formData?: FormData) {
  await requireAdmin();
  const to = back(formData);
  if (!isShippoTest) done(to, "Simulated scans only work with Shippo's test key.");
  const { data } = await createAdminClient().from("orders").select("tracking_number").eq("id", orderId).single();
  if (!data?.tracking_number) done(to, "This order has no tracking number yet.");
  await applyTracking(data.tracking_number, status);
  done(to, status === "TRANSIT" ? "Simulated the first USPS scan." : "Simulated delivery.");
}

export async function adminRunSweep() {
  await requireAdmin();
  const r = await runOrderSweep();
  done(
    "/admin",
    `Daily checks ran: ${r.reminders} reminders, ${r.cancelled} cancelled, ${r.labelsRetried} labels and ${r.payoutsRetried} payouts retried, ${r.holdsReleased} holds released.`,
  );
}

// Listings --------------------------------------------------------------------

/** Takes a listing off the site and tells the seller why. Sold items can't be removed. */
export async function adminRemoveListing(listingId: string, formData: FormData) {
  const admin = await requireAdmin();
  const why = String(formData.get("why") ?? "")
    .trim()
    .slice(0, 500);
  const db = createAdminClient();
  const { data } = await db
    .from("listings")
    .update({ status: "removed", reserved_until: null, updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .in("status", ["active", "paused"])
    .select("title, seller_id")
    .maybeSingle();
  if (!data) done(back(formData, "/admin/listings"), "Only listings that are for sale or paused can be removed.");

  // Any open reports on it are dealt with.
  await db
    .from("reports")
    .update({ status: "resolved", resolved_by: admin.id })
    .eq("listing_id", listingId)
    .eq("status", "open");
  updateTag(LISTINGS_TAG);

  const to = await emailOf(data.seller_id);
  if (to) {
    await sendEmail({
      to,
      subject: `Your listing was removed: ${data.title}`,
      text: [
        `We've taken down your listing "${data.title}" from Outdoor Supply Central.`,
        why ? `\nReason: ${why}` : ``,
        ``,
        `See what can be sold: ${siteUrl()}/help/banned-items`,
        `Questions? Reply to this email.`,
      ].join("\n"),
    });
  }
  done(back(formData, "/admin/listings"), "Listing removed and the seller emailed.");
}

/** Puts a removed listing back, paused, so the seller decides when it goes live again. */
export async function adminRestoreListing(listingId: string, formData: FormData) {
  await requireAdmin();
  const { data } = await createAdminClient()
    .from("listings")
    .update({ status: "paused", updated_at: new Date().toISOString() })
    .eq("id", listingId)
    .eq("status", "removed")
    .select("id");
  updateTag(LISTINGS_TAG);
  done(
    back(formData, "/admin/listings"),
    data?.length ? "Restored as paused. The seller can put it back on sale." : "Nothing to restore.",
  );
}

// Reports ---------------------------------------------------------------------

export async function adminDismissReport(reportId: string, formData: FormData) {
  const admin = await requireAdmin();
  await createAdminClient()
    .from("reports")
    .update({ status: "dismissed", resolved_by: admin.id })
    .eq("id", reportId)
    .eq("status", "open");
  done(back(formData, "/admin/reports"), "Report dismissed.");
}

// Users -----------------------------------------------------------------------

/**
 * Suspends a member: their listings are paused and they can't list, buy or
 * resume listings until an admin lifts it. Orders already paid carry on.
 */
export async function adminSetSuspended(userId: string, suspend: boolean, formData: FormData) {
  const admin = await requireAdmin();
  const to = back(formData, "/admin/users");
  if (userId === admin.id) done(to, "You can't suspend yourself.");
  const db = createAdminClient();
  const { data: target } = await db.from("profiles").select("role").eq("id", userId).single();
  if (target?.role === "admin") done(to, "Admins can't be suspended. Remove their admin role first.");

  await db
    .from("profiles")
    .update({ suspended_at: suspend ? new Date().toISOString() : null })
    .eq("id", userId);
  if (suspend) {
    await db.from("listings").update({ status: "paused" }).eq("seller_id", userId).eq("status", "active");
    updateTag(LISTINGS_TAG);
  }
  done(to, suspend ? "Suspended. Their listings are paused." : "Suspension lifted. They can resume their listings.");
}

// Settings --------------------------------------------------------------------

/** The commission on each sale. Orders keep the rate they were paid at. */
export async function adminSetCommission(formData: FormData) {
  await requireAdmin();
  const percent = Number.parseFloat(String(formData.get("percent") ?? ""));
  if (!Number.isFinite(percent) || percent < 0 || percent > 30) {
    done("/admin/settings", "Enter a commission between 0% and 30%.");
  }
  const rate = Math.round(percent * 100) / 10_000; // two decimal places of a percent
  await createAdminClient()
    .from("settings")
    .upsert({ key: "commission_rate", value: rate, updated_at: new Date().toISOString() });
  revalidateTag(SETTINGS_TAG, { expire: 0 });
  done("/admin/settings", `Commission set to ${percent}%. New sales use it from now on.`);
}
