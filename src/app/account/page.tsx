import type { Metadata } from "next";
import { CircleCheck, LogOut } from "lucide-react";
import { Card, Field, PageTitle, PreviewNotice, buttonClass, inputClass } from "@/components/ui";
import { requireUser, type CurrentUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { deleteAccount, signOut, updateAccount } from "../auth/actions";
import { AddressFields, type SavedAddress } from "./AddressFields";

export const metadata: Metadata = { title: "Account settings" };

const PREVIEW_USER: CurrentUser = {
  id: "preview",
  email: "",
  displayName: "JD's Gear Closet",
  city: null,
  state: null,
  intent: "both",
  activities: [],
  shipFromZip: null,
  role: "member",
  onboarded: true,
  payoutsEnabled: false,
};

export default async function AccountPage(props: PageProps<"/account">) {
  const sp = await props.searchParams;
  let user = PREVIEW_USER;
  let address: SavedAddress | null = null;

  if (isSupabaseConfigured) {
    user = await requireUser();
    const supabase = await createClient();
    const { data } = await supabase
      .from("seller_addresses")
      .select("name, line1, line2, city, state, zip, phone")
      .eq("user_id", user.id)
      .maybeSingle();
    address = data;
  }
  const live = isSupabaseConfigured;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <PageTitle>Account settings</PageTitle>

      {sp.saved === "1" && (
        <p role="status" className="mb-6 flex items-center gap-2 rounded-md bg-pine px-4 py-3 text-white">
          <CircleCheck className="size-5" aria-hidden="true" /> Saved.
        </p>
      )}

      {sp.error === "phone" && (
        <p role="alert" className="mb-6 rounded-md border border-alert/30 bg-alert/5 p-4 font-semibold text-alert">
          Nothing was saved. Enter a 10-digit phone number, or leave it blank.
        </p>
      )}

      <div className="space-y-6">
        <form action={updateAccount} className="space-y-6">
          <Card className="space-y-5">
            <h2 className="text-xl">Profile</h2>
            <Field label="Display name" htmlFor="displayName">
              <input
                id="displayName"
                name="displayName"
                defaultValue={user.displayName}
                maxLength={40}
                className={inputClass}
              />
            </Field>
            <Field label="Email" htmlFor="email" hint="If you change it, we'll email the new address to confirm.">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                defaultValue={user.email}
                placeholder="you@example.com"
                className={inputClass}
              />
            </Field>
            <p className="text-[15px] text-muted">Buyers see your display name and city only. Never your address.</p>
          </Card>

          <Card className="space-y-5">
            <h2 className="text-xl">Ship-from address</h2>
            <p className="text-[15px] text-muted">Printed on your USPS labels. Only you and USPS see it.</p>
            <AddressFields address={address} fallbackZip={user.shipFromZip ?? ""} />
          </Card>

          <button type="submit" className={buttonClass("primary", "w-full sm:w-auto")} disabled={!live}>
            Save changes
          </button>
        </form>

        <Card>
          <form action={signOut}>
            <button type="submit" className={buttonClass("outline", "w-full sm:w-auto")}>
              <LogOut className="size-5" aria-hidden="true" />
              Sign out
            </button>
          </form>
        </Card>

        <Card className="space-y-3 border-alert/30">
          <h2 className="text-xl text-alert">Delete my account</h2>
          <p className="text-[15px] text-muted">
            This removes your profile and listings for good. Type DELETE to confirm.
          </p>
          {sp.delete === "confirm" && (
            <p role="alert" className="font-semibold text-alert">
              Type DELETE in capitals to confirm.
            </p>
          )}
          {sp.delete === "failed" && (
            <p role="alert" className="font-semibold text-alert">
              Something went wrong. Nothing was deleted; please try again.
            </p>
          )}
          <form action={deleteAccount} className="flex flex-col gap-3 sm:flex-row">
            <label htmlFor="confirm" className="sr-only">
              Type DELETE to confirm
            </label>
            <input id="confirm" name="confirm" autoComplete="off" placeholder="DELETE" className={inputClass} />
            <button type="submit" className={buttonClass("ghost", "shrink-0 text-alert")} disabled={!live}>
              Delete account
            </button>
          </form>
        </Card>

        {!live && <PreviewNotice>saving and deleting turn on once Supabase is connected.</PreviewNotice>}
      </div>
    </div>
  );
}
