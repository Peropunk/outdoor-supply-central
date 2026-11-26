// Sales tax (JD, Nov 2026): collect Texas sales and use tax at 8.25% on orders
// shipped to Texas. Texas taxes the delivery charge on taxable items, so the
// rate applies to the item and the shipping. Other states: none for now (see
// the sales-by-state report in Admin for economic-nexus thresholds).

export const TEXAS_TAX_RATE = 0.0825;

/** Stripe calculates tax per line item and rounds each one, so this does the same. */
export function salesTaxCents(state: string, itemCents: number, shippingCents: number) {
  if (state.toUpperCase() !== "TX") return 0;
  return Math.round(itemCents * TEXAS_TAX_RATE) + Math.round(shippingCents * TEXAS_TAX_RATE);
}
