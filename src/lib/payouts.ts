import "server-only";
import { createSellerAccount } from "./stripe";
import { createAdminClient } from "./supabase/server";

/** The seller's Stripe account, created on first use. Only the server can set it on the profile. */
export async function ensureSellerAccount(user: { id: string; email: string; displayName: string }) {
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("stripe_account_id").eq("id", user.id).single();
  if (profile?.stripe_account_id) return profile.stripe_account_id as string;

  const accountId = await createSellerAccount(user);
  await admin.from("profiles").update({ stripe_account_id: accountId }).eq("id", user.id);
  return accountId;
}
