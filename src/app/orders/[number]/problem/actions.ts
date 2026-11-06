"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/auth";
import { PROBLEM_REASONS } from "@/lib/catalog";
import { notifyThread } from "@/lib/messages";
import { createAdminClient, createClient } from "@/lib/supabase/server";

const MAX_PHOTOS = 4;

export type PostResult = { ok: true } | { ok: false; error: string };

/**
 * Adds a message to the order's problem thread. Row level security lets only
 * the buyer, the seller and admins write; photos must sit in the author's own
 * folder for this order (uploaded by the browser first).
 */
export async function postOrderMessage(
  number: string,
  input: { reason?: string; body: string; photoPaths: string[] },
): Promise<PostResult> {
  const user = await requireUser(`/orders/${number}/problem`);
  const { data: order } = await createAdminClient()
    .from("orders")
    .select("id, number, buyer_id, seller_id, listings(title)")
    .eq("number", number)
    .maybeSingle();
  const isParty = order && (order.buyer_id === user.id || order.seller_id === user.id);
  if (!order || (!isParty && user.role !== "admin")) return { ok: false, error: "Order not found." };

  const text = input.body.trim().slice(0, 4000);
  if (input.reason && !PROBLEM_REASONS.includes(input.reason)) return { ok: false, error: "Pick what's wrong." };
  if (!text) return { ok: false, error: "Write a message first." };
  const folder = `${user.id}/orders/${order.id}/`;
  const photos = input.photoPaths.slice(0, MAX_PHOTOS);
  if (!photos.every((p) => p.startsWith(folder) && !p.includes(".."))) {
    return { ok: false, error: "A photo didn't upload properly. Please try again." };
  }

  const admin = createAdminClient();
  const { count } = await admin
    .from("order_messages")
    .select("id", { count: "exact", head: true })
    .eq("order_id", order.id);
  const first = !count;
  const body = input.reason ? `${input.reason}\n\n${text}` : text;

  const supabase = await createClient();
  const { error } = await supabase
    .from("order_messages")
    .insert({ order_id: order.id, author_id: user.id, body, photo_paths: photos });
  if (error) return { ok: false, error: "We couldn't send that. Please try again." };

  const listing = order.listings as unknown as { title: string } | null;
  await notifyThread(order, user.id, listing?.title ?? "the order", body, first);
  refresh();
  return { ok: true };
}
