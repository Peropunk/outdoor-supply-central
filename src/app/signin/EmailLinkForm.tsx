"use client";

import { useActionState } from "react";
import { Mail, MailCheck } from "lucide-react";
import { Field, buttonClass, inputClass } from "@/components/ui";
import { sendEmailLink, type EmailLinkState } from "../auth/actions";

export function EmailLinkForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<EmailLinkState, FormData>(sendEmailLink, { status: "idle" });

  if (state.status === "sent") {
    return (
      <div role="status" className="rounded-md bg-sand p-4 text-center">
        <MailCheck className="mx-auto size-8 text-trail" aria-hidden="true" />
        <p className="mt-2 font-semibold">Check your email</p>
        <p className="text-[15px] text-muted">
          We sent a sign-in link to <strong className="text-ink">{state.email}</strong>. Open it on this device.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}
      <Field label="Email" htmlFor="email" hint="We'll email you a link that signs you in.">
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          inputMode="email"
          className={inputClass}
          aria-invalid={state.status === "error"}
        />
      </Field>
      {state.status === "error" && (
        <p role="alert" className="font-semibold text-alert">
          {state.message}
        </p>
      )}
      <button type="submit" disabled={pending} className={buttonClass("primary", "w-full")}>
        <Mail className="size-5" aria-hidden="true" />
        {pending ? "Sending…" : "Email me a sign-in link"}
      </button>
    </form>
  );
}
