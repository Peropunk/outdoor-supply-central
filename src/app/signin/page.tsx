import type { Metadata } from "next";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Card, Field, PreviewNotice, buttonClass, inputClass } from "@/components/ui";

export const metadata: Metadata = { title: "Sign in" };

// Decision 1 default: Google or an emailed sign-in link (no passwords), then
// three quick questions for new accounts. Wired to Supabase Auth in Chunk 2.
export default function SignInPage() {
  return (
    <div className="mx-auto max-w-md px-4 pt-10">
      <h1 className="text-center text-3xl">Sign in or join</h1>
      <p className="mt-2 text-center text-muted">One account to buy and sell. No password to remember.</p>

      <Card className="mt-8 space-y-5">
        <Link href="/welcome" className={buttonClass("outline", "w-full normal-case tracking-normal")}>
          <GoogleMark />
          Continue with Google
        </Link>

        <div className="flex items-center gap-3 text-[14px] text-muted">
          <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
        </div>

        <Field label="Email" htmlFor="email" hint="We'll email you a link that signs you in.">
          <input id="email" type="email" autoComplete="email" inputMode="email" className={inputClass} />
        </Field>
        <Link href="/welcome" className={buttonClass("primary", "w-full")}>
          <Mail className="size-5" aria-hidden="true" />
          Email me a sign-in link
        </Link>
      </Card>

      <p className="mt-4 text-center text-[14px] text-muted">
        By continuing you agree to the <Link href="/help/terms">terms of use</Link> and{" "}
        <Link href="/help/privacy">privacy policy</Link>.
      </p>
      <div className="mt-6">
        <PreviewNotice>both buttons skip ahead to the welcome questions until sign-in is connected.</PreviewNotice>
      </div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
      />
    </svg>
  );
}
