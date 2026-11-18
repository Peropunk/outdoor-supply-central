// Stripe's Restricted Businesses policy: no dealings with Cuba, Iran, North
// Korea, Syria, or the Crimea, Donetsk and Luhansk regions of Ukraine.
// Vercel adds the visitor's country and region to every request it serves
// (x-vercel-ip-country, x-vercel-ip-country-region: ISO 3166 codes). Visitors
// can't set these themselves: Vercel overwrites them at its edge.

/** Countries blocked outright (ISO 3166-1 alpha-2). */
export const BLOCKED_COUNTRIES = new Set(["CU", "IR", "KP", "SY"]);

/** Regions of Ukraine blocked (ISO 3166-2:UA): Crimea, Sevastopol, Donetsk, Luhansk. */
export const BLOCKED_UA_REGIONS = new Set(["43", "40", "14", "09"]);

type HeaderReader = { get(name: string): string | null };

/** True when the request comes from a country or region Stripe's policy restricts. */
export function isRestrictedRegion(headers: HeaderReader) {
  const country = headers.get("x-vercel-ip-country")?.toUpperCase();
  if (!country) return false; // Local development: no geolocation headers.
  if (BLOCKED_COUNTRIES.has(country)) return true;
  const region = headers.get("x-vercel-ip-country-region")?.toUpperCase().replace(/^UA-/, "");
  return country === "UA" && Boolean(region && BLOCKED_UA_REGIONS.has(region));
}

export const RESTRICTED_MESSAGE = "Outdoor Supply Central isn't available in your region.";

/** The page restricted regions get instead of the site (HTTP 451, sent straight from proxy.ts). */
export const BLOCKED_PAGE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>Not available in your region · Outdoor Supply Central</title><style>body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f7f3ea;color:#1f2a1a;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;padding:24px}main{max-width:32rem}h1{color:#2e5a1c;font-size:28px;margin:0 0 12px}p{color:#545e4b;font-size:17px;line-height:1.5;margin:0}</style></head><body><main><h1>Not available in your region</h1><p>Outdoor Supply Central is a marketplace for buyers and sellers in the United States. Buying, selling and payments aren&#39;t available where you are.</p></main></body></html>`;
