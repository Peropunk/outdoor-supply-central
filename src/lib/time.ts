// One time zone for every date on the site and in emails. Servers run in UTC,
// so without this a buyer in New York who pays at 9 pm would see tomorrow's
// date. US Eastern until JD confirms his own.
export const SITE_TIME_ZONE = "America/New_York";

/** "2026-11" for the calendar month a moment falls in, in the site's time zone. */
export function monthKey(iso: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SITE_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}`;
}
