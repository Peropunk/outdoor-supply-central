import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CircleAlert } from "lucide-react";
import { GearPhoto } from "@/components/GearPhoto";
import { Card, Field, PageTitle, buttonClass, inputClass } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { CONDITIONS, PACKAGE_SIZES, getCategory } from "@/lib/catalog";
import { getListingsBySeller } from "@/lib/listings";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { updateListing } from "../../actions";

export const metadata: Metadata = { title: "Edit listing" };

// Sellers can change the words, condition, price and package size of an
// unsold listing. The category and photos stay as they are; to change those,
// delete the listing and list it again.
export default async function EditListingPage(props: PageProps<"/listings/[id]/edit">) {
  if (!isSupabaseConfigured) redirect("/dashboard?tab=listings");
  const [{ id }, sp, user] = await Promise.all([props.params, props.searchParams, requireUser()]);

  const listing = (await getListingsBySeller(user.id)).find((l) => l.id === id);
  if (!listing) notFound();
  if (listing.status !== "active" && listing.status !== "paused") redirect("/dashboard?tab=listings");
  const category = getCategory(listing.category)!;
  const error = typeof sp.error === "string" ? sp.error : null;

  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <PageTitle
        sub={`${category.name} · ${listing.photos.length} ${listing.photos.length === 1 ? "photo" : "photos"}`}
      >
        Edit listing
      </PageTitle>

      {error && (
        <p
          role="alert"
          className="mb-6 flex items-center gap-2 rounded-md border border-alert/30 bg-alert/5 p-4 text-alert"
        >
          <CircleAlert className="size-5 shrink-0" aria-hidden="true" /> {error}
        </p>
      )}

      <form action={updateListing.bind(null, listing.id)} className="space-y-6">
        <input type="hidden" name="category" value={listing.category} />
        <Card className="space-y-5">
          <div className="flex gap-3 overflow-x-auto no-scrollbar">
            {listing.photos.map((photo, i) => (
              <GearPhoto key={i} photo={photo} size="sm" className="w-20 shrink-0 rounded-md" />
            ))}
          </div>
          <Field label="Title" htmlFor="title">
            <input
              id="title"
              name="title"
              defaultValue={listing.title}
              maxLength={80}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Brand (optional)" htmlFor="brand">
            <input id="brand" name="brand" defaultValue={listing.brand ?? ""} className={inputClass} />
          </Field>
          <Field label="Type" htmlFor="subcategory">
            <select id="subcategory" name="subcategory" defaultValue={listing.subcategory} className={inputClass}>
              <option value="">Choose…</option>
              {category.subcategories.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <fieldset>
            <legend className="font-semibold">Condition</legend>
            <div className="mt-2 grid gap-2">
              {CONDITIONS.map((c) => (
                <label
                  key={c.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-paper p-3 has-checked:border-trail has-checked:ring-1 has-checked:ring-trail"
                >
                  <input
                    type="radio"
                    name="condition"
                    value={c.id}
                    defaultChecked={listing.condition === c.id}
                    className="mt-1 size-5 shrink-0 accent-trail"
                  />
                  <span>
                    <span className="font-semibold">{c.label}</span>
                    <span className="block text-[15px] text-muted">{c.meaning}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Wear and flaws" htmlFor="flaws">
            <textarea id="flaws" name="flaws" rows={3} defaultValue={listing.flaws} required className={inputClass} />
          </Field>
          <Field label="Description (optional)" htmlFor="description">
            <textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={listing.description}
              className={inputClass}
            />
          </Field>
        </Card>

        <Card className="space-y-5">
          <Field label="Price" htmlFor="price" hint="You earn the price minus our fee. The buyer pays shipping.">
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-lg text-muted">$</span>
              <input
                id="price"
                name="price"
                inputMode="decimal"
                defaultValue={(listing.priceCents / 100).toFixed(2).replace(/\.00$/, "")}
                required
                className={`${inputClass} pl-7 text-xl font-bold`}
              />
            </div>
          </Field>
          <fieldset>
            <legend className="font-semibold">Package size</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {PACKAGE_SIZES.map((p) => (
                <label
                  key={p.id}
                  className="flex cursor-pointer items-start gap-3 rounded-md border border-line bg-paper p-3 has-checked:border-trail has-checked:ring-1 has-checked:ring-trail"
                >
                  <input
                    type="radio"
                    name="packageSize"
                    value={p.id}
                    defaultChecked={listing.packageSize === p.id}
                    className="mt-1 size-5 shrink-0 accent-trail"
                  />
                  <span>
                    <span className="font-semibold">
                      {p.label} · up to {p.maxWeightLb} lb
                    </span>
                    <span className="block text-[15px] text-muted">{p.examples}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </Card>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button type="submit" className={buttonClass("primary", "sm:flex-1")}>
            Save changes
          </button>
          <Link href="/dashboard?tab=listings" className={buttonClass("outline")}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
