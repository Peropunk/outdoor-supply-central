import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { SellFlow, type SellerContext } from "./SellFlow";

export const metadata: Metadata = { title: "Sell your gear" };

export default async function SellPage() {
  let seller: SellerContext | null = null;

  if (isSupabaseConfigured) {
    const user = await requireUser("/sell");
    const supabase = await createClient();
    const { data: address } = await supabase
      .from("seller_addresses")
      .select("name, line1, line2, city, state, zip, phone")
      .eq("user_id", user.id)
      .maybeSingle();
    seller = {
      id: user.id,
      needsAddress: !address?.phone,
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
