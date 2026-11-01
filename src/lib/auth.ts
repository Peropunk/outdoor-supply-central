import "server-only";
import { redirect } from "next/navigation";
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
};

/** The signed-in user, or null when signed out or in preview mode. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, city, state, intent, activities, ship_from_zip, role, onboarded_at")
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
  };
}

/** Like getCurrentUser, but sends signed-out visitors to the sign-in page. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/signin");
  return user;
}
