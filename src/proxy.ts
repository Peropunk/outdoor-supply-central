import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { BLOCKED_PAGE, isRestrictedRegion } from "@/lib/restricted-regions";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "@/lib/supabase/config";

// Two jobs, before any page runs:
// 1. Geo-blocking: visitors from regions Stripe restricts get the "not
//    available" page (HTTP 451) instead of the site. Webhooks and the daily
//    job (/api/*) are called by Stripe, Shippo and Vercel, never by visitors.
// 2. Keeps the Supabase sign-in session fresh: an expired access token is
//    swapped for a new one here, before any page reads it.
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!path.startsWith("/api/") && isRestrictedRegion(request.headers)) {
    // A page of its own rather than a rewrite: a rewrite to a prerendered page keeps that page's
    // 200 status, and "no-store" keeps this answer out of every cache.
    return new NextResponse(BLOCKED_PAGE, {
      status: 451,
      headers: { "content-type": "text/html; charset=utf-8", "cache-control": "private, no-store" },
    });
  }

  if (!isSupabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // Validates the token and triggers the refresh above when needed.
  await supabase.auth.getClaims();
  return response;
}

export const config = {
  // Skip static files and images.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
