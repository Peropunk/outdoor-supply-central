import "server-only";
import { isDeliverable, isShippoConfigured } from "./shippo";

/**
 * Asks USPS (through Shippo) whether a seller's ship-from address exists, so a
 * mistyped address is caught when it's saved, not when a label fails after a
 * sale. If Shippo can't be reached, the address is accepted rather than
 * blocking the seller; the label step would still catch it.
 */
export async function shipFromAddressOk(a: {
  name: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  zip: string;
}) {
  if (!isShippoConfigured) return true;
  try {
    return await isDeliverable({
      name: a.name || "Seller",
      street1: a.line1,
      street2: a.line2 ?? "",
      city: a.city,
      state: a.state,
      zip: a.zip,
    });
  } catch {
    return true;
  }
}
