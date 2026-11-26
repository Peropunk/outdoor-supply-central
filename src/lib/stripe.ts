import "server-only";
import Stripe from "stripe";

// Stripe (Chunk 4). Separate charges and transfers: buyers pay the platform,
// and the seller's share is transferred after USPS's first scan (Chunk 5).
// Sellers are Accounts v2 recipients with the Express Dashboard.

export const isStripeConfigured = Boolean(process.env.STRIPE_SECRET_KEY);

let client: Stripe | undefined;

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
  client ??= new Stripe(process.env.STRIPE_SECRET_KEY);
  return client;
}

/** Creates the seller's Stripe account. Stripe collects their ID and bank details itself. */
export async function createSellerAccount(user: { id: string; email: string; displayName: string }) {
  const account = await getStripe().v2.core.accounts.create({
    contact_email: user.email,
    display_name: user.displayName || undefined,
    identity: { country: "US" },
    dashboard: "express",
    defaults: { responsibilities: { fees_collector: "application", losses_collector: "application" } },
    configuration: { recipient: { capabilities: { stripe_balance: { stripe_transfers: { requested: true } } } } },
    metadata: { user_id: user.id },
  });
  return account.id;
}

/** A single-use link to Stripe's hosted sign-up for this seller. */
export async function sellerOnboardingUrl(accountId: string, origin: string) {
  const link = await getStripe().v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        refresh_url: `${origin}/payouts/refresh`,
        return_url: `${origin}/payouts/return`,
      },
    },
  });
  return link.url;
}

/** True once Stripe will accept transfers to this seller. */
export async function canReceiveTransfers(accountId: string) {
  const account = await getStripe().v2.core.accounts.retrieve(accountId, { include: ["configuration.recipient"] });
  return account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status === "active";
}

let texasRateId: string | undefined;

/**
 * The Texas 8.25% sales tax rate in this Stripe account, found by its metadata
 * or created on first use (sandbox and live each get their own). Checkout
 * applies it to Texas orders, so Stripe's tax reports show what was collected.
 */
export async function texasTaxRateId() {
  if (texasRateId) return texasRateId;
  const stripe = getStripe();
  const existing = await stripe.taxRates.list({ active: true, limit: 100 });
  const found = existing.data.find((r) => r.metadata?.osc === "texas-sales-tax" && r.percentage === 8.25);
  texasRateId =
    found?.id ??
    (
      await stripe.taxRates.create(
        {
          display_name: "Texas sales tax",
          description: "Texas sales and use tax, 8.25%",
          percentage: 8.25,
          inclusive: false,
          country: "US",
          state: "TX",
          jurisdiction: "US-TX",
          tax_type: "sales_tax",
          metadata: { osc: "texas-sales-tax" },
        },
        { idempotencyKey: "osc-texas-sales-tax-8.25" },
      )
    ).id;
  return texasRateId;
}
