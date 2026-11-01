import { ORDER_STEPS, SHIP_BY_DAYS } from "./catalog";
import { getSampleListing, type Listing } from "./listings";
import { commissionFor } from "./money";

// Sample orders stand in for the `orders` table until Stripe and Shippo are
// connected (Chunks 4 and 5).

export { ORDER_STEPS } from "./catalog";
export type OrderStep = (typeof ORDER_STEPS)[number];

export type OrderStatus = "paid" | "label_ready" | "shipped" | "delivered" | "cancelled" | "refunded";

export type Order = {
  number: string;
  listingId: string;
  buyer: { name: string; city: string; state: string };
  status: OrderStatus;
  itemCents: number;
  shippingCents: number;
  commissionCents: number;
  paidAt: string;
  shipBy: string;
  events: { step: OrderStep; at: string }[];
  tracking?: string;
  sellerPaidAt?: string;
};

function addDays(iso: string, days: number) {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

function sample(
  number: string,
  listingId: string,
  itemCents: number,
  shippingCents: number,
  status: OrderStatus,
  paidAt: string,
  extra: Partial<Order>,
): Order {
  return {
    number,
    listingId,
    buyer: { name: "Sam P.", city: "Portland", state: "OR" },
    status,
    itemCents,
    shippingCents,
    commissionCents: commissionFor(itemCents),
    paidAt,
    shipBy: addDays(paidAt, SHIP_BY_DAYS),
    events: [{ step: "Paid", at: paidAt }],
    ...extra,
  };
}

const ORDERS: Order[] = [
  sample("OSC-10482", "l_1013", 6500, 625, "shipped", "2026-10-26T18:02:00Z", {
    events: [
      { step: "Paid", at: "2026-10-26T18:02:00Z" },
      { step: "Label ready", at: "2026-10-26T18:03:00Z" },
      { step: "Shipped", at: "2026-10-27T15:41:00Z" },
    ],
    tracking: "9400 1000 0000 0000 0000 00",
    sellerPaidAt: "2026-10-27T15:41:00Z",
  }),
  sample("OSC-10491", "l_1004", 7500, 1595, "label_ready", "2026-10-29T21:15:00Z", {
    buyer: { name: "Ana G.", city: "Reno", state: "NV" },
    events: [
      { step: "Paid", at: "2026-10-29T21:15:00Z" },
      { step: "Label ready", at: "2026-10-29T21:16:00Z" },
    ],
  }),
];

export async function getOrder(number: string) {
  const order = ORDERS.find((o) => o.number === number);
  if (!order) return undefined;
  return { order, listing: getSampleListing(order.listingId) as Listing };
}

export async function getOrders() {
  return Promise.all(
    ORDERS.map(async (order) => ({
      order,
      listing: getSampleListing(order.listingId) as Listing,
    })),
  );
}

export function currentStepIndex(status: OrderStatus) {
  return { paid: 0, label_ready: 1, shipped: 2, delivered: 3, cancelled: -1, refunded: -1 }[status];
}
