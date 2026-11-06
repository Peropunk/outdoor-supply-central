import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { sellerOnboardingUrl } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/server";

// Stripe sends sellers here when a sign-up link has expired or was already
// used. A fresh link is only made for the signed-in owner of the account.
export async function GET(request: NextRequest) {
  const { origin } = request.nextUrl;
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(`${origin}/signin?next=${encodeURIComponent("/dashboard?tab=payouts")}`);

  const { data: profile } = await createAdminClient()
    .from("profiles")
    .select("stripe_account_id")
    .eq("id", user.id)
    .single();
  if (!profile?.stripe_account_id) return NextResponse.redirect(`${origin}/dashboard?tab=payouts`);

  try {
    return NextResponse.redirect(await sellerOnboardingUrl(profile.stripe_account_id, origin));
  } catch {
    return NextResponse.redirect(`${origin}/dashboard?tab=payouts&payouts=error`);
  }
}
