// Decision 5 default: commission is an admin setting with a 10% placeholder,
// and the platform absorbs card fees until JD decides. Amounts are in cents.
export const DEFAULT_COMMISSION_RATE = 0.1;

export function commissionFor(priceCents: number, rate = DEFAULT_COMMISSION_RATE) {
  return Math.round(priceCents * rate);
}

export function sellerEarnings(priceCents: number, rate = DEFAULT_COMMISSION_RATE) {
  return priceCents - commissionFor(priceCents, rate);
}

export function formatUSD(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function dollarsToCents(value: string) {
  const n = Number.parseFloat(value.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}
