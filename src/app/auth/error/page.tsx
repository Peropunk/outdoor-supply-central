import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = { title: "Sign-in link expired" };

export default function AuthErrorPage() {
  return (
    <div className="mx-auto max-w-md px-4 pt-16 text-center">
      <h1 className="text-3xl">That link didn&apos;t work</h1>
      <p className="mt-2 text-muted">
        Sign-in links work once and expire after an hour. Ask for a new one and use it on the same device.
      </p>
      <ButtonLink href="/signin" className="mt-6">
        Try again
      </ButtonLink>
    </div>
  );
}
