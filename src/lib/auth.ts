import "server-only";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { connection } from "next/server";
import type { ACTIVITIES } from "./catalog";
import { isSupabaseConfigured } from "./supabase/config";
import { createClient } from "./supabase/server";

// Data Access Layer for the signed-in user. Pages and server actions read the
// user only through these functions.

export type Intent = "buying" | "selling" | "both";

export type CurrentUser = {
  id: string;
  email: string;
  displayName: string;
  city: string | null;
  state: string | null;
  intent: Intent | null;
  activities: (typeof ACTIVITIES)[number][];
  shipFromZip: string | null;
  role: "member" | "admin";
  onboarded: boolean;
  /** Stripe has accepted the seller's payout details, so they can be paid. */
  payoutsEnabled: boolean;
  /** An admin suspended the account: no listing or buying until it's lifted. */
  suspended: boolean;
};

/** The signed-in user, or null when signed out or in preview mode. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured) return null;

  // Supabase checks token expiry against the clock, so this must only run per
  // request, never while Next.js prerenders the page.
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, city, state, intent, activities, ship_from_zip, role, onboarded_at, payouts_enabled, suspended_at",
    )
    .eq("id", user.id)
    .single();

  return {
    id: user.id,
    email: user.email ?? "",
    displayName: profile?.display_name ?? "",
    city: profile?.city ?? null,
    state: profile?.state ?? null,
    intent: profile?.intent ?? null,
    activities: profile?.activities ?? [],
    shipFromZip: profile?.ship_from_zip ?? null,
    role: profile?.role ?? "member",
    onboarded: Boolean(profile?.onboarded_at),
    payoutsEnabled: Boolean(profile?.payouts_enabled),
    suspended: Boolean(profile?.suspended_at),
  };
}

/**
 * Like getCurrentUser, but sends signed-out visitors to the sign-in page. Pass
 * `returnTo` to bring them back to that page afterwards.
 */
export async function requireUser(returnTo?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect(returnTo ? `/signin?next=${encodeURIComponent(returnTo)}` : "/signin");
  return user;
}

/** Admins only. Everyone else gets a plain 404, so the admin area isn't advertised. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser("/admin");
  if (user.role !== "admin") notFound();
  return user;
}

const NEXT_COOKIE = "osc_next";

/** Only ever a path on this site, so a sign-in link can't redirect elsewhere. */
function safeNext(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") ? value : null;
}

/** Remembers where to go after sign-in. Google and email links can't carry it themselves. */
export async function rememberNext(value: FormDataEntryValue | null) {
  const next = safeNext(typeof value === "string" ? value : undefined);
  if (!next) return;
  (await cookies()).set(NEXT_COOKIE, next, { path: "/", maxAge: 3600, httpOnly: true, sameSite: "lax" });
}

/** The remembered page, once: reading it clears it. */
export async function takeNext() {
  const store = await cookies();
  const next = safeNext(store.get(NEXT_COOKIE)?.value);
  if (next) store.delete(NEXT_COOKIE);
  return next;
}

/** New users answer the welcome questions first; returning users go to their dashboard. */
export async function landingPathAfterSignIn(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase.from("profiles").select("onboarded_at").eq("id", userId).single();
  if (!profile?.onboarded_at) return "/welcome"; // saveWelcome picks up the remembered page
  return (await takeNext()) ?? "/dashboard";
}
