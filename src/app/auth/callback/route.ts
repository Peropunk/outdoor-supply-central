import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// Google and email sign-in links land here with a one-time code. New users go
// on to the 3 welcome questions; returning users go to their dashboard.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  if (!isSupabaseConfigured || !code) return NextResponse.redirect(`${origin}/auth/error`);

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(`${origin}/auth/error`);

  const { data: profile } = await supabase.from("profiles").select("onboarded_at").eq("id", data.user.id).single();
  return NextResponse.redirect(`${origin}${profile?.onboarded_at ? "/dashboard" : "/welcome"}`);
}
