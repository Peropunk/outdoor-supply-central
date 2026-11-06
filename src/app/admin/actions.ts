"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { applyTracking, buyLabelForOrder, refundOrder, runOrderSweep } from "@/lib/fulfillment";
import { isShippoTest } from "@/lib/shippo";
import { createAdminClient } from "@/lib/supabase/server";

// Admin order tools. Every action checks the admin role itself, because a
// server action can be called directly, not only from the admin page.

function done(message: string): never {
  redirect(`/admin?msg=${encodeURIComponent(message)}`);
}

export async function adminRefund(orderId: string) {
  await requireAdmin();
  const result = await refundOrder(orderId, "admin");
  done(result.ok ? "Refunded in full. The buyer and seller have been emailed." : result.error);
}

export async function adminRetryLabel(orderId: string) {
  await requireAdmin();
  done(
    (await buyLabelForOrder(orderId, false))
      ? "USPS label bought and sent to the seller."
      : "The label still couldn't be bought. Check the server log.",
  );
}

/** Test mode only: pretends USPS scanned or delivered the package, to check the order flow end to end. */
export async function adminSimulateTracking(orderId: string, status: "TRANSIT" | "DELIVERED") {
  await requireAdmin();
  if (!isShippoTest) done("Simulated scans only work with Shippo's test key.");
  const { data } = await createAdminClient().from("orders").select("tracking_number").eq("id", orderId).single();
  if (!data?.tracking_number) done("This order has no tracking number yet.");
  await applyTracking(data.tracking_number, status);
  done(status === "TRANSIT" ? "Simulated the first USPS scan." : "Simulated delivery.");
}

export async function adminRunSweep() {
  await requireAdmin();
  const r = await runOrderSweep();
  done(
    `Daily checks ran: ${r.reminders} reminders, ${r.cancelled} cancelled, ${r.labelsRetried} labels and ${r.payoutsRetried} payouts retried, ${r.holdsReleased} holds released.`,
  );
}
