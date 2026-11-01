import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { landingPathAfterSignIn } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// Every sign-in link lands here. Google and Supabase's default email links
// carry a one-time `code`, which only works in the browser that asked for it.
// Email links built from the template in SETUP.md carry a `token_hash`
// instead, which also works when opened on another device.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  if (!isSupabaseConfigured || !(code || (tokenHash && type))) {
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  const supabase = await createClient();
  const { data, error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : await supabase.auth.verifyOtp({ type: type!, token_hash: tokenHash! });
  if (error || !data.user) return NextResponse.redirect(`${origin}/auth/error`);

  return NextResponse.redirect(`${origin}${await landingPathAfterSignIn(supabase, data.user.id)}`);
}
