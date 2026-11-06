"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Camera, ChevronLeft, CircleAlert, PartyPopper, Star, X } from "lucide-react";
import { StreetAddressInput } from "@/components/StreetAddressInput";
import { Button, ConditionBadge, Field, PreviewNotice, buttonClass, inputClass } from "@/components/ui";
import {
  BANNED_ITEMS,
  CATEGORIES,
  CONDITIONS,
  PACKAGE_SIZES,
  boxLabel,
  getCategory,
  normalizePhone,
  type ConditionId,
  type PackageSizeId,
} from "@/lib/catalog";
import { DEFAULT_COMMISSION_RATE, commissionFor, dollarsToCents, formatUSD, sellerEarnings } from "@/lib/money";
import { resizeImage } from "@/lib/resize-image";
import { getBrowserClient } from "@/lib/supabase/client";
import { PHOTO_BUCKET } from "@/lib/supabase/config";
import { createListing } from "../listings/actions";

const STEPS = ["Photos", "Details", "Price and package", "Review"] as const;
const MAX_PHOTOS = 10;

/** The signed-in seller when Supabase is connected; null in preview mode. */
export type SellerContext = { id: string; needsAddress: boolean; address: Address };

type Address = { name: string; line1: string; line2: string; city: string; state: string; zip: string; phone: string };

type Draft = {
  photos: { url: string; size: number; blob: Blob }[];
  title: string;
  brand: string;
  category: string;
  subcategory: string;
  condition: ConditionId | "";
  flaws: string;
  description: string;
  price: string;
  packageSize: PackageSizeId | "";
  agreed: boolean;
  address: Address;
};

const EMPTY: Draft = {
  photos: [],
  title: "",
  brand: "",
  category: "",
  subcategory: "",
  condition: "",
  flaws: "",
  description: "",
  price: "",
  packageSize: "",
  agreed: false,
  address: { name: "", line1: "", line2: "", city: "", state: "", zip: "", phone: "" },
};

function problems(step: number, d: Draft, needsAddress: boolean): string[] {
  const out: string[] = [];
  if (step === 0 && d.photos.length === 0) out.push("Add at least one photo.");
  if (step === 1) {
    if (d.title.trim().length < 5) out.push("Give your item a title of at least 5 characters.");
    if (!d.category) out.push("Pick a category.");
    if (!d.condition) out.push("Pick a condition.");
    if (d.flaws.trim().length < 3) out.push("Describe any wear or flaws, or write “None”.");
    if (d.condition === "fair" && d.photos.length < 2)
      out.push("Fair condition needs a photo of the flaws. Go back and add one more photo.");
  }
  if (step === 2) {
    const cents = dollarsToCents(d.price);
    if (cents < 500) out.push("Set a price of at least $5.");
    if (!d.packageSize) out.push("Pick a package size.");
  }
  if (step === 3 && needsAddress) {
    const a = d.address;
    if (!a.name.trim() || !a.line1.trim() || !a.city.trim()) out.push("Fill in your name, street and city.");
    if (!/^[A-Za-z]{2}$/.test(a.state.trim())) out.push("Use the 2-letter state code, like OR.");
    if (!/^\d{5}$/.test(a.zip.trim())) out.push("Enter a 5-digit ZIP code.");
    if (!normalizePhone(a.phone)) out.push("Enter a real 10-digit US phone number. USPS needs it for your labels.");
  }
  if (step === 3 && !d.agreed) out.push("Confirm the item isn't on the banned list.");
  return out;
}

/** `rate` is the admin's commission setting, so "You earn" matches what the sale will pay. */
export function SellFlow({ seller, rate = DEFAULT_COMMISSION_RATE }: { seller: SellerContext | null; rate?: number }) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(() => (seller ? { ...EMPTY, address: seller.address } : EMPTY));
  const [errors, setErrors] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState<{ id: string | null } | null>(null);
  const [addressSaved, setAddressSaved] = useState(false);
  const needsAddress = Boolean(seller?.needsAddress) && !addressSaved;
  const headingRef = useRef<HTMLHeadingElement>(null);

  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  // Move focus to the new step's heading for screen readers, but not on first load.
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) headingRef.current?.focus();
    mounted.current = true;
  }, [step]);

  async function publish() {
    if (!seller) {
      setPublished({ id: null });
      return;
    }

    // Photos go straight from the phone to Storage under <seller>/<listing>/,
    // then the server checks everything and saves the listing.
    const id = crypto.randomUUID();
    const storage = getBrowserClient().storage.from(PHOTO_BUCKET);
    const paths: string[] = [];
    try {
      for (const [i, photo] of draft.photos.entries()) {
        const path = `${seller.id}/${id}/${i + 1}.jpg`;
        const { error } = await storage.upload(path, photo.blob, { contentType: "image/jpeg", upsert: false });
        if (error) throw new Error("A photo didn't upload. Check your connection and try again.");
        paths.push(path);
      }
      const result = await createListing({
        id,
        photoPaths: paths,
        agreedToRules: draft.agreed,
        address: needsAddress ? draft.address : undefined,
        fields: {
          title: draft.title,
          brand: draft.brand,
          category: draft.category,
          subcategory: draft.subcategory,
          condition: draft.condition,
          flaws: draft.flaws,
          description: draft.description,
          priceCents: dollarsToCents(draft.price),
          packageSize: draft.packageSize,
        },
      });
      if (!result.ok) throw new Error(result.error);
      setAddressSaved(true);
      setPublished({ id: result.id });
    } catch (e) {
      if (paths.length) await storage.remove(paths);
      setErrors([e instanceof Error && e.message ? e.message : "Publishing failed. Please try again."]);
    }
  }

  async function next() {
    const p = problems(step, draft, needsAddress);
    setErrors(p);
    if (p.length) return;
    if (step === STEPS.length - 1) {
      setPublishing(true);
      await publish();
      setPublishing(false);
      window.scrollTo({ top: 0 });
      return;
    }
    setStep(step + 1);
    window.scrollTo({ top: 0 });
  }

  function back() {
    setErrors([]);
    setStep(Math.max(0, step - 1));
  }

  if (published) {
    return (
      <div className="py-10 text-center">
        <PartyPopper className="mx-auto size-12 text-trail" aria-hidden="true" />
        <h1 className="mt-4 text-3xl">Your gear is listed</h1>
        <p className="mt-2 text-muted">
          We&apos;ll email you the moment it sells, with a QR code to drop it off at USPS.
        </p>
        {!published.id && (
          <div className="mx-auto mt-6 max-w-sm">
            <PreviewNotice>listings save once Supabase is connected.</PreviewNotice>
          </div>
        )}
        <div className="mt-8 grid gap-3 sm:flex sm:justify-center">
          {published.id && (
            <Link href={`/item/${published.id}`} className={buttonClass("primary")}>
              See your listing
            </Link>
          )}
          <button
            type="button"
            className={buttonClass(published.id ? "outline" : "primary")}
            onClick={() => {
              draft.photos.forEach((p) => URL.revokeObjectURL(p.url));
              setDraft({ ...EMPTY, address: draft.address });
              setStep(0);
              setPublished(null);
            }}
          >
            List another item
          </button>
          <Link href="/dashboard" className={buttonClass("outline")}>
            Go to my dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        {step > 0 && (
          <button
            type="button"
            onClick={back}
            className="-ml-3 flex size-12 items-center justify-center rounded-md hover:bg-sand"
            aria-label="Back to previous step"
          >
            <ChevronLeft className="size-6" aria-hidden="true" />
          </button>
        )}
        <p className="label-caps text-[13px] text-muted">
          Step {step + 1} of {STEPS.length}
        </p>
      </div>
      <ol className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden="true">
        {STEPS.map((s, i) => (
          <li key={s} className={`h-1.5 rounded-full ${i <= step ? "bg-trail" : "bg-line"}`} />
        ))}
      </ol>
      <h1 ref={headingRef} tabIndex={-1} className="mt-5 text-3xl outline-none">
        {STEPS[step]}
      </h1>

      <div className="mt-6 space-y-6">
        {step === 0 && <PhotosStep draft={draft} update={update} />}
        {step === 1 && <DetailsStep draft={draft} update={update} />}
        {step === 2 && <PriceStep draft={draft} update={update} rate={rate} />}
        {step === 3 && <ReviewStep draft={draft} update={update} needsAddress={needsAddress} rate={rate} />}
      </div>

      {errors.length > 0 && (
        <div role="alert" className="mt-6 rounded-md border border-alert/30 bg-alert/5 p-4 text-alert">
          <p className="flex items-center gap-2 font-semibold">
            <CircleAlert className="size-5" aria-hidden="true" />
            Almost there
          </p>
          <ul className="mt-1 list-disc pl-6">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="sticky bottom-0 -mx-4 mt-8 border-t border-line bg-canvas/95 px-4 py-3 backdrop-blur">
        <Button type="button" onClick={next} disabled={publishing} className="w-full">
          {step < STEPS.length - 1 ? "Next" : publishing ? "Publishing…" : "Publish listing"}
        </Button>
      </div>
    </div>
  );
}

type StepProps = { draft: Draft; update: (patch: Partial<Draft>) => void };

function PhotosStep({ draft, update }: StepProps) {
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function addFiles(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const room = MAX_PHOTOS - draft.photos.length;
    const resized = await Promise.all(
      Array.from(files)
        .slice(0, room)
        .map(async (f) => {
          const blob = await resizeImage(f);
          return { url: URL.createObjectURL(blob), size: blob.size, blob };
        }),
    );
    update({ photos: [...draft.photos, ...resized] });
    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function remove(i: number) {
    URL.revokeObjectURL(draft.photos[i].url);
    update({ photos: draft.photos.filter((_, j) => j !== i) });
  }

  function makeCover(i: number) {
    const photos = [...draft.photos];
    const [p] = photos.splice(i, 1);
    update({ photos: [p, ...photos] });
  }

  return (
    <>
      <p className="text-muted">
        Good light and a plain background sell gear faster. Show the whole item first, then labels, wear and any flaws
        up close.
      </p>
      <ul className="grid grid-cols-3 gap-3">
        {draft.photos.map((p, i) => (
          <li key={p.url} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img
              src={p.url}
              alt={`Photo ${i + 1}${i === 0 ? ", cover" : ""}`}
              className="aspect-square w-full rounded-md object-cover"
            />
            {i === 0 ? (
              <span className="absolute bottom-1 left-1 rounded bg-pine px-1.5 text-[12px] text-white">Cover</span>
            ) : (
              <button
                type="button"
                onClick={() => makeCover(i)}
                className="absolute bottom-1 left-1 flex size-9 items-center justify-center rounded-full bg-paper/90"
                aria-label={`Make photo ${i + 1} the cover`}
              >
                <Star className="size-4" aria-hidden="true" />
              </button>
            )}
            <button
              type="button"
              onClick={() => remove(i)}
              className="absolute top-1 right-1 flex size-9 items-center justify-center rounded-full bg-paper/90"
              aria-label={`Remove photo ${i + 1}`}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </li>
        ))}
        {draft.photos.length < MAX_PHOTOS && (
          <li>
            <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-trail/60 bg-paper text-center text-pine hover:bg-sand">
              <Camera className="size-7" aria-hidden="true" />
              <span className="text-[14px] font-semibold">{busy ? "Adding…" : "Add photos"}</span>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => addFiles(e.target.files)}
              />
            </label>
          </li>
        )}
      </ul>
      <p className="text-[14px] text-muted">
        Up to {MAX_PHOTOS} photos. We shrink them on your phone before upload so it&apos;s quick on mobile data.
      </p>
    </>
  );
}

function DetailsStep({ draft, update }: StepProps) {
  const category = getCategory(draft.category);
  return (
    <>
      <Field label="Title" htmlFor="title" hint="Brand, model and size if it has one.">
        <input
          id="title"
          value={draft.title}
          onChange={(e) => update({ title: e.target.value })}
          placeholder="e.g. REI Half Dome 2 tent"
          maxLength={80}
          className={inputClass}
        />
      </Field>
      <Field label="Brand (optional)" htmlFor="brand">
        <input
          id="brand"
          value={draft.brand}
          onChange={(e) => update({ brand: e.target.value })}
          className={inputClass}
        />
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Category" htmlFor="category">
          <select
            id="category"
            value={draft.category}
            onChange={(e) => update({ category: e.target.value, subcategory: "" })}
            className={inputClass}
          >
            <option value="">Choose…</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type" htmlFor="subcategory">
          <select
            id="subcategory"
            value={draft.subcategory}
            onChange={(e) => update({ subcategory: e.target.value })}
            disabled={!category}
            className={inputClass}
          >
            <option value="">{category ? "Choose…" : "Pick a category first"}</option>
            {category?.subcategories.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="font-semibold">Condition</legend>
        <div className="mt-2 grid gap-2">
          {CONDITIONS.map((c) => (
            <label
              key={c.id}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                draft.condition === c.id ? "border-trail bg-trail/5 ring-1 ring-trail" : "border-line bg-paper"
              }`}
            >
              <input
                type="radio"
                name="condition"
                value={c.id}
                checked={draft.condition === c.id}
                onChange={() => update({ condition: c.id })}
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

      <Field
        label="Wear and flaws"
        htmlFor="flaws"
        hint="Buyers see this right under the condition. Be specific: stains, scuffs, repairs, missing parts."
      >
        <textarea
          id="flaws"
          value={draft.flaws}
          onChange={(e) => update({ flaws: e.target.value })}
          rows={3}
          placeholder="e.g. Small scuff on the lid, zipper pull replaced"
          className={inputClass}
        />
      </Field>
      <Field label="Description (optional)" htmlFor="description" hint="What's included, sizing, why you're selling.">
        <textarea
          id="description"
          value={draft.description}
          onChange={(e) => update({ description: e.target.value })}
          rows={4}
          className={inputClass}
        />
      </Field>
    </>
  );
}

function PriceStep({ draft, update, rate }: StepProps & { rate: number }) {
  const cents = dollarsToCents(draft.price);
  return (
    <>
      <Field label="Price" htmlFor="price">
        <div className="relative">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-lg text-muted">$</span>
          <input
            id="price"
            inputMode="decimal"
            value={draft.price}
            onChange={(e) => update({ price: e.target.value.replace(/[^0-9.]/g, "") })}
            placeholder="0"
            className={`${inputClass} pl-7 text-xl font-bold`}
          />
        </div>
      </Field>
      <div className="rounded-[var(--radius-card)] bg-pine p-5 text-white" aria-live="polite">
        <p className="label-caps text-[13px] text-white/80">You earn</p>
        <p className="mt-1 text-4xl font-bold">{formatUSD(sellerEarnings(cents, rate))}</p>
        <p className="mt-1 text-[15px] text-white/85">
          {formatUSD(cents)} price − {formatUSD(commissionFor(cents, rate))} fee ({Math.round(rate * 10_000) / 100}
          %). The buyer pays shipping.
        </p>
      </div>

      <fieldset>
        <legend className="font-semibold">Package size</legend>
        <p className="text-[14px] text-muted">
          Pick the box your item will ship in, packed. The buyer pays the USPS rate.
        </p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {PACKAGE_SIZES.map((p) => (
            <label
              key={p.id}
              className={`flex cursor-pointer items-start gap-3 rounded-md border p-3 ${
                draft.packageSize === p.id ? "border-trail bg-trail/5 ring-1 ring-trail" : "border-line bg-paper"
              }`}
            >
              <input
                type="radio"
                name="package"
                value={p.id}
                checked={draft.packageSize === p.id}
                onChange={() => update({ packageSize: p.id })}
                className="mt-1 size-5 shrink-0 accent-trail"
              />
              <span>
                <span className="font-semibold">
                  {p.label} · up to {p.maxWeightLb} lb
                </span>
                <span className="block text-[15px] text-muted">{p.examples}</span>
                <span className="block text-[14px] text-muted">Box up to {boxLabel(p)}</span>
                <span className="block text-[14px] text-muted">Buyer pays about {formatUSD(p.estimateCents)}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>
    </>
  );
}

function ReviewStep({ draft, update, needsAddress, rate }: StepProps & { needsAddress: boolean; rate: number }) {
  const cents = dollarsToCents(draft.price);
  const pkg = PACKAGE_SIZES.find((p) => p.id === draft.packageSize);
  return (
    <>
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-paper">
        {draft.photos[0] && (
          /* eslint-disable-next-line @next/next/no-img-element -- local blob preview */
          <img src={draft.photos[0].url} alt="Cover photo" className="aspect-[4/3] w-full object-cover" />
        )}
        <div className="space-y-2 p-5">
          <p className="price">{formatUSD(cents)}</p>
          <p className="text-lg font-semibold">{draft.title}</p>
          {draft.condition && <ConditionBadge condition={draft.condition} withMeaning />}
          <p className="text-[15px]">
            <span className="font-semibold">Wear and flaws:</span> {draft.flaws}
          </p>
          <p className="text-[15px] text-muted">
            {getCategory(draft.category)?.name}
            {draft.subcategory && ` · ${draft.subcategory}`} · {draft.photos.length}{" "}
            {draft.photos.length === 1 ? "photo" : "photos"} · {pkg?.label} package
          </p>
          <p className="font-semibold text-pine">You earn {formatUSD(sellerEarnings(cents, rate))}</p>
        </div>
      </div>

      <div className="rounded-[var(--radius-card)] border border-line bg-paper p-5">
        <p className="font-semibold">Not allowed on Outdoor Supply Central</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[15px] text-muted">
          {BANNED_ITEMS.map((b) => (
            <li key={b}>{b}</li>
          ))}
        </ul>
        <label className="mt-4 flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={draft.agreed}
            onChange={(e) => update({ agreed: e.target.checked })}
            className="mt-1 size-5 shrink-0 accent-trail"
          />
          <span>My item isn&apos;t on this list, and I&apos;ll ship it within 5 days of the sale.</span>
        </label>
      </div>

      {needsAddress && <AddressCard draft={draft} update={update} />}
    </>
  );
}

/** Asked once, before a seller's first listing: USPS labels need the full ship-from address. */
function AddressCard({ draft, update }: StepProps) {
  const a = draft.address;
  const set = (patch: Partial<Address>) => update({ address: { ...a, ...patch } });
  return (
    <div className="space-y-4 rounded-[var(--radius-card)] border border-line bg-paper p-5">
      <div>
        <p className="font-semibold">Where will you ship from?</p>
        <p className="text-[15px] text-muted">
          Used for your USPS labels. Buyers only see your city and state. We&apos;ll remember it for next time.
        </p>
      </div>
      <Field label="Name on labels" htmlFor="ship-name">
        <input
          id="ship-name"
          autoComplete="name"
          value={a.name}
          onChange={(e) => set({ name: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Street address" htmlFor="ship-line1">
        <StreetAddressInput
          id="ship-line1"
          autoComplete="address-line1"
          value={a.line1}
          onChange={(line1) => set({ line1 })}
          onPick={set}
        />
      </Field>
      <Field label="Apartment, suite (optional)" htmlFor="ship-line2">
        <input
          id="ship-line2"
          autoComplete="address-line2"
          value={a.line2}
          onChange={(e) => set({ line2: e.target.value })}
          className={inputClass}
        />
      </Field>
      <Field label="Phone" htmlFor="ship-phone" hint="USPS requires it for labels. Buyers never see it.">
        <input
          id="ship-phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={a.phone}
          onChange={(e) => set({ phone: e.target.value })}
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-[1fr_72px_100px] gap-3">
        <Field label="City" htmlFor="ship-city">
          <input
            id="ship-city"
            autoComplete="address-level2"
            value={a.city}
            onChange={(e) => set({ city: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="State" htmlFor="ship-state">
          <input
            id="ship-state"
            autoComplete="address-level1"
            maxLength={2}
            value={a.state}
            onChange={(e) => set({ state: e.target.value.toUpperCase() })}
            className={inputClass}
          />
        </Field>
        <Field label="ZIP" htmlFor="ship-zip">
          <input
            id="ship-zip"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            value={a.zip}
            onChange={(e) => set({ zip: e.target.value.replace(/\D/g, "") })}
            className={inputClass}
          />
        </Field>
      </div>
    </div>
  );
}
