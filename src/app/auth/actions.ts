"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { ACTIVITIES } from "@/lib/catalog";
import { requireUser, type Intent } from "@/lib/auth";
import { isGoogleSignInEnabled, isSupabaseConfigured } from "@/lib/supabase/config";
import { createAdminClient, createClient } from "@/lib/supabase/server";

async function callbackUrl() {
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${origin}/auth/callback`;
}

// Sign-in ---------------------------------------------------------------------

export async function signInWithGoogle() {
  if (!isSupabaseConfigured) redirect("/welcome");
  if (!isGoogleSignInEnabled) redirect("/signin");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: await callbackUrl() },
  });
  if (error || !data.url) redirect("/auth/error");
  redirect(data.url);
}

export type EmailLinkState = { status: "idle" | "sent" | "error"; message?: string; email?: string };

export async function sendEmailLink(_prev: EmailLinkState, formData: FormData): Promise<EmailLinkState> {
  const email = String(formData.get("email") ?? "").trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { status: "error", message: "Enter a valid email address." };
  }
  if (!isSupabaseConfigured) redirect("/welcome");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: await callbackUrl(), shouldCreateUser: true },
  });
  if (error) {
    return { status: "error", message: "We couldn't send the link. Wait a minute and try again." };
  }
  return { status: "sent", email };
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

// Welcome questionnaire -------------------------------------------------------

const INTENTS: Intent[] = ["buying", "selling", "both"];

export async function saveWelcome(formData: FormData) {
  const intent = String(formData.get("intent") ?? "") as Intent;
  const sells = intent === "selling" || intent === "both";
  const destination = sells ? "/sell" : "/browse";

  if (!isSupabaseConfigured) redirect(destination);
  const user = await requireUser();
  if (!INTENTS.includes(intent)) redirect("/welcome");

  const activities = formData
    .getAll("activities")
    .map(String)
    .filter((a) => (ACTIVITIES as readonly string[]).includes(a));
  const zip = String(formData.get("zip") ?? "").trim();
  const displayName = String(formData.get("displayName") ?? "")
    .trim()
    .slice(0, 40);

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      intent,
      activities,
      ship_from_zip: sells && /^\d{5}$/.test(zip) ? zip : null,
      display_name: displayName || user.displayName,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);
  if (error) redirect("/welcome?error=1");

  redirect(destination);
}

// Account settings ------------------------------------------------------------

export async function updateAccount(formData: FormData) {
  const user = await requireUser();
  const supabase = await createClient();
  const field = (name: string) => String(formData.get(name) ?? "").trim();

  const address = {
    name: field("name"),
    line1: field("line1"),
    line2: field("line2") || null,
    city: field("city"),
    state: field("state").toUpperCase(),
    zip: field("zip"),
  };
  const hasAddress = address.line1 && address.city && /^[A-Z]{2}$/.test(address.state) && /^\d{5}$/.test(address.zip);

  await supabase
    .from("profiles")
    .update({
      display_name: field("displayName").slice(0, 40) || user.displayName,
      // Buyers see city and state only; the street address stays private.
      city: hasAddress ? address.city : user.city,
      state: hasAddress ? address.state : user.state,
      ship_from_zip: hasAddress ? address.zip : user.shipFromZip,
    })
    .eq("id", user.id);

  if (hasAddress) {
    await supabase.from("seller_addresses").upsert({
      user_id: user.id,
      ...address,
      name: address.name || user.displayName,
      updated_at: new Date().toISOString(),
    });
  }

  // Changing the email sends a confirmation link to the new address.
  const email = field("email");
  if (email && email !== user.email) await supabase.auth.updateUser({ email });

  redirect("/account?saved=1");
}

export async function deleteAccount(formData: FormData) {
  const user = await requireUser();
  if (formData.get("confirm") !== "DELETE") redirect("/account?delete=confirm");

  // Removes the auth user; profiles, addresses and listings cascade.
  // Chunk 4 adds a check for open orders and pending payouts first.
  const { error } = await createAdminClient().auth.admin.deleteUser(user.id);
  if (error) redirect("/account?delete=failed");

  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
