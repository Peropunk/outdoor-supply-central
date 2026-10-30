import type { Metadata } from "next";
import { LogOut } from "lucide-react";
import { Card, Field, PageTitle, PreviewNotice, buttonClass, inputClass } from "@/components/ui";

export const metadata: Metadata = { title: "Account settings" };

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <PageTitle>Account settings</PageTitle>
      <div className="space-y-6">
        <Card className="space-y-5">
          <h2 className="text-xl">Profile</h2>
          <Field label="Display name" htmlFor="display">
            <input id="display" defaultValue="JD's Gear Closet" className={inputClass} />
          </Field>
          <Field label="Email" htmlFor="email">
            <input id="email" type="email" placeholder="you@example.com" className={inputClass} />
          </Field>
          <p className="text-[15px] text-muted">Buyers see your display name and city only. Never your address.</p>
        </Card>

        <Card className="space-y-5">
          <h2 className="text-xl">Ship-from address</h2>
          <Field label="Street address" htmlFor="line1">
            <input id="line1" autoComplete="address-line1" className={inputClass} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="City" htmlFor="city">
              <input id="city" autoComplete="address-level2" className={inputClass} />
            </Field>
            <Field label="ZIP code" htmlFor="zip">
              <input id="zip" inputMode="numeric" autoComplete="postal-code" className={inputClass} />
            </Field>
          </div>
          <button type="button" className={buttonClass("primary")} disabled>
            Save changes
          </button>
        </Card>

        <Card className="flex flex-col gap-3 sm:flex-row sm:justify-between">
          <button type="button" className={buttonClass("outline")} disabled>
            <LogOut className="size-5" aria-hidden="true" />
            Sign out
          </button>
          <button type="button" className={buttonClass("ghost", "text-alert")} disabled>
            Delete my account
          </button>
        </Card>
        <PreviewNotice>saving turns on with sign-in in Chunk 2.</PreviewNotice>
      </div>
    </div>
  );
}
