import type { Metadata } from "next";
import { Card, Field, buttonClass, inputClass } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { SHIP_BY_DAYS, SHIP_REMINDER_DAY } from "@/lib/catalog";
import { formatUSD, sellerEarnings } from "@/lib/money";
import { commissionRate } from "@/lib/orders-server";
import { adminSetCommission } from "../actions";
import { AdminNav } from "../AdminNav";

export const metadata: Metadata = { title: "Admin: settings", robots: { index: false } };

export default async function AdminSettingsPage(props: PageProps<"/admin/settings">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const rate = await commissionRate();
  const percent = Math.round(rate * 10_000) / 100;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <AdminNav current="/admin/settings" msg={sp.msg} />

      <Card className="mt-6 space-y-4">
        <h2 className="text-xl">Commission</h2>
        <p className="text-muted">
          Taken from the item price on each sale; shipping isn&apos;t included. Changing it affects new sales only. At{" "}
          {percent}%, a {formatUSD(10000)} sale earns the seller {formatUSD(sellerEarnings(10000, rate))}.
        </p>
        <form action={adminSetCommission} className="flex items-end gap-2">
          <Field label="Commission (%)" htmlFor="percent">
            <input
              id="percent"
              name="percent"
              type="number"
              inputMode="decimal"
              min={0}
              max={30}
              step={0.01}
              defaultValue={percent}
              className={`${inputClass} w-32`}
            />
          </Field>
          <button type="submit" className={buttonClass("primary", "min-h-12")}>
            Save
          </button>
        </form>
      </Card>

      <Card className="mt-4 space-y-2">
        <h2 className="text-xl">Shipping rules</h2>
        <p>
          Sellers have {SHIP_BY_DAYS} days to ship, with a reminder on day {SHIP_REMINDER_DAY}. After that the order is
          refunded and the item relisted.
        </p>
        <p className="text-[14px] text-muted">
          Changing these needs a small code update, because the help pages and emails quote them.
        </p>
      </Card>
    </div>
  );
}
