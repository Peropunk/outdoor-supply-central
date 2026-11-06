import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, takeNext } from "@/lib/auth";
import { canReceiveTransfers } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

// Stripe sends sellers here after its hosted sign-up. Records whether they can
// now be paid, then returns them to where they started (usually /sell).
export async function GET(request: NextRequest) {
  const { origin } = request.nextUrl;
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${origin}/signin?next=${encodeURIComponent("/dashboard?tab=payouts")}`);

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("stripe_account_id").eq("id", user.id).single();
  if (!profile?.stripe_account_id) return NextResponse.redirect(`${origin}/dashboard?tab=payouts`);

  let ready = false;
  try {
    ready = await canReceiveTransfers(profile.stripe_account_id);
  } catch {
    return NextResponse.redirect(`${origin}/dashboard?tab=payouts&payouts=error`);
  }
  await admin.from("profiles").update({ payouts_enabled: ready }).eq("id", user.id);

  if (!ready) return NextResponse.redirect(`${origin}/dashboard?tab=payouts&payouts=pending`);
  return NextResponse.redirect(`${origin}${(await takeNext()) ?? "/dashboard?tab=payouts&payouts=ready"}`);
}
