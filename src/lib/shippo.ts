import "server-only";
import { getPackageSize, type PackageSizeId } from "./catalog";

// Shippo: USPS rates now, labels and tracking in Chunk 5. Decision 6 default:
// the buyer pays the live rate for the size the seller picked when listing.

const API = "https://api.goshippo.com";

export type ShippoAddress = {
  name: string;
  street1: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  email?: string;
  phone?: string;
};

export type UspsRate = {
  rateId: string;
  amountCents: number;
  service: string;
  estimatedDays: number | null;
};

export const isShippoConfigured = Boolean(process.env.SHIPPO_API_TOKEN);
/** Test labels are free and never ship; the admin page can then simulate USPS scans. */
export const isShippoTest = Boolean(process.env.SHIPPO_API_TOKEN?.startsWith("shippo_test_"));

async function shippo<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    headers: { Authorization: `ShippoToken ${process.env.SHIPPO_API_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`Shippo ${path} failed with ${res.status}`);
  return res.json() as Promise<T>;
}

function toShippoAddress(a: ShippoAddress) {
  return { ...a, street2: a.street2 || undefined, country: "US" };
}

/** Asks Shippo whether USPS can deliver to this address. */
export async function isDeliverable(address: ShippoAddress): Promise<boolean> {
  const result = await shippo<{ validation_results?: { is_valid?: boolean } }>("/addresses/", {
    ...toShippoAddress(address),
    validate: true,
  });
  return result.validation_results?.is_valid !== false;
}

/** The cheapest USPS rate for a package of this size, or null if USPS offers none. */
export async function cheapestUspsRate(
  from: ShippoAddress,
  to: ShippoAddress,
  packageSize: PackageSizeId,
  options: { qrCode?: boolean; orderNumber?: string } = {},
): Promise<UspsRate | null> {
  const { box, maxWeightLb } = getPackageSize(packageSize);
  const shipment = await shippo<{
    rates?: {
      object_id: string;
      provider: string;
      amount: string;
      estimated_days?: number | null;
      servicelevel: { name: string };
    }[];
  }>("/shipments/", {
    address_from: toShippoAddress(from),
    address_to: toShippoAddress(to),
    parcels: [
      {
        length: String(box.length),
        width: String(box.width),
        height: String(box.height),
        distance_unit: "in",
        weight: String(maxWeightLb),
        mass_unit: "lb",
      },
    ],
    // The QR code lets the seller ship from a Post Office counter without a printer.
    extra: options.qrCode ? { qr_code_requested: true } : undefined,
    metadata: options.orderNumber,
    async: false,
  });

  const cheapest = (shipment.rates ?? [])
    .filter((r) => r.provider === "USPS")
    .sort((a, b) => Number(a.amount) - Number(b.amount))[0];
  if (!cheapest) return null;

  return {
    rateId: cheapest.object_id,
    amountCents: Math.round(Number(cheapest.amount) * 100),
    service: cheapest.servicelevel.name,
    estimatedDays: cheapest.estimated_days ?? null,
  };
}

export type Label = {
  transactionId: string;
  labelUrl: string;
  qrCodeUrl: string | null;
  trackingNumber: string;
  costCents: number;
};

/**
 * Buys the prepaid USPS label, with a Post Office QR code, at today's cheapest
 * USPS rate. The rate is quoted fresh because a checkout's quote can be days old.
 */
export async function buyLabel(
  from: ShippoAddress,
  to: ShippoAddress,
  packageSize: PackageSizeId,
  orderNumber: string,
): Promise<Label> {
  const rate = await cheapestUspsRate(from, to, packageSize, { qrCode: true, orderNumber });
  if (!rate) throw new Error("USPS offers no rate for this shipment");
  const tx = await shippo<{
    object_id: string;
    status: string;
    label_url?: string;
    qr_code_url?: string | null;
    tracking_number?: string;
    messages?: { text?: string }[];
  }>("/transactions/", { rate: rate.rateId, label_file_type: "PDF", metadata: orderNumber, async: false });
  if (tx.status !== "SUCCESS" || !tx.label_url || !tx.tracking_number) {
    const why = tx.messages?.map((m) => m.text).filter(Boolean).join("; ");
    throw new Error(`Shippo label ${tx.status}${why ? `: ${why}` : ""}`);
  }
  return {
    transactionId: tx.object_id,
    labelUrl: tx.label_url,
    qrCodeUrl: tx.qr_code_url ?? null,
    trackingNumber: tx.tracking_number,
    costCents: rate.amountCents,
  };
}

/** Voids an unused label so its postage is refunded. USPS refunds unused labels within a few weeks. */
export async function voidLabel(transactionId: string) {
  await shippo("/refunds/", { transaction: transactionId, async: false });
}
