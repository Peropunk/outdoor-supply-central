/**
 * The site's public address, for links in emails and for Stripe and Shippo
 * callbacks. NEXT_PUBLIC_SITE_URL wins; on Vercel the production domain is the
 * fallback, so emails never link to localhost by mistake.
 */
export function siteUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
