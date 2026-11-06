"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { rememberNext, requireUser } from "@/lib/auth";
import { ensureSellerAccount } from "@/lib/payouts";
import { getStripe, sellerOnboardingUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

async function origin() {
  return (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}

/** Sends the seller to Stripe's hosted sign-up, then back to /payouts/return. */
export async function startPayoutSetup(formData: FormData) {
  const user = await requireUser("/dashboard?tab=payouts");
  await rememberNext(formData.get("next"));

  let url: string;
  try {
    const accountId = await ensureSellerAccount(user);
    url = await sellerOnboardingUrl(accountId, await origin());
  } catch {
    redirect("/dashboard?tab=payouts&payouts=error");
  }
  redirect(url);
}

/** Opens the seller's Stripe Express Dashboard: payouts, bank details and tax forms. */
export async function openStripeDashboard() {
  const user = await requireUser("/dashboard?tab=payouts");
  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();
  if (!profile?.stripe_account_id) redirect("/dashboard?tab=payouts");

  let url: string;
  try {
    url = (await getStripe().accounts.createLoginLink(profile.stripe_account_id)).url;
  } catch {
    redirect("/dashboard?tab=payouts&payouts=error");
  }
  redirect(url);
}
