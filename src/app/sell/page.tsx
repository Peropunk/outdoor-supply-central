import type { Metadata } from "next";
import { Card, buttonClass } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { normalizePhone } from "@/lib/catalog";
import { isStripeConfigured } from "@/lib/stripe";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { startPayoutSetup } from "../payouts/actions";
import { SellFlow, type SellerContext } from "./SellFlow";

export const metadata: Metadata = { title: "Sell your gear" };

export default async function SellPage() {
  let seller: SellerContext | null = null;

  if (isSupabaseConfigured) {
    const user = await requireUser("/sell");
    // Work plan, Chunk 4: payouts must be set up before a seller's first listing goes live.
    if (isStripeConfigured && !user.payoutsEnabled) return <PayoutsFirst />;
    const supabase = await createClient();
    const { data: address } = await supabase
      .from("seller_addresses")
      .select("name, line1, line2, city, state, zip, phone")
      .eq("user_id", user.id)
      .maybeSingle();
    seller = {
      id: user.id,
      // Asked again if the saved phone isn't a real number: USPS refuses labels without one.
      needsAddress: !normalizePhone(address?.phone ?? ""),
      address: {
        name: address?.name ?? user.displayName,
        line1: address?.line1 ?? "",
        line2: address?.line2 ?? "",
        city: address?.city ?? "",
        state: address?.state ?? "",
        zip: address?.zip ?? user.shipFromZip ?? "",
        phone: "",
      },
    };
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <SellFlow seller={seller} />
    </div>
  );
}

function PayoutsFirst() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-10">
      <h1 className="text-3xl">One thing before you list</h1>
      <Card className="mt-6 space-y-4">
        <p>
          Set up payouts with Stripe so we can pay you when your gear sells. It takes a few minutes, and Stripe keeps
          your bank details safe. We never see them.
        </p>
        <form action={startPayoutSetup}>
          <input type="hidden" name="next" value="/sell" />
          <button type="submit" className={buttonClass("primary", "w-full")}>
            Set up payouts with Stripe
          </button>
        </form>
        <p className="text-[14px] text-muted">You&apos;ll come straight back here to list your item.</p>
      </Card>
    </div>
  );
}
