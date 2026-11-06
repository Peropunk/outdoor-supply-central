"use server";

import { updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { CATEGORIES, CONDITIONS, PACKAGE_SIZES, normalizePhone } from "@/lib/catalog";
import { LISTINGS_TAG } from "@/lib/listings-db";
import { PHOTO_BUCKET, isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// Seller and reporting actions for listings (Chunk 3). Every action checks the
// signed-in user here, and row level security checks again in the database.

const SUSPENDED = "Your account is suspended, so you can't list items right now. Reply to our email to sort it out.";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_PHOTOS = 10;

export type ListingFields = {
  title: string;
  brand: string;
  category: string;
  subcategory: string;
  condition: string;
  flaws: string;
  description: string;
  priceCents: number;
  packageSize: string;
};

export type ShipFromAddress = {
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
};

export type ActionResult = { ok: true; id: string } | { ok: false; error: string };

function checkFields(f: ListingFields): string | null {
  const category = CATEGORIES.find((c) => c.slug === f.category);
  if (f.title.trim().length < 5 || f.title.trim().length > 80) return "The title needs 5 to 80 characters.";
  if (!category) return "Pick a category.";
  if (f.subcategory && !category.subcategories.includes(f.subcategory)) return "Pick a type from the list.";
  if (!CONDITIONS.some((c) => c.id === f.condition)) return "Pick a condition.";
  if (f.flaws.trim().length < 3) return "Describe any wear or flaws, or write “None”.";
  if (!Number.isInteger(f.priceCents) || f.priceCents < 500 || f.priceCents > 10_000_00)
    return "Set a price between $5 and $10,000.";
  if (!PACKAGE_SIZES.some((p) => p.id === f.packageSize)) return "Pick a package size.";
  return null;
}

function checkAddress(a: ShipFromAddress): string | null {
  if (!a.name.trim() || !a.line1.trim() || !a.city.trim()) return "Fill in your name, street and city.";
  if (!/^[A-Za-z]{2}$/.test(a.state.trim())) return "Use the 2-letter state code, like OR.";
  if (!/^\d{5}$/.test(a.zip.trim())) return "Enter a 5-digit ZIP code.";
  if (!normalizePhone(a.phone)) return "Enter a real 10-digit US phone number. USPS needs it for your labels.";
  return null;
}

function columns(f: ListingFields) {
  return {
    title: f.title.trim(),
    brand: f.brand.trim() || null,
    category: f.category,
    subcategory: f.subcategory || null,
    condition: f.condition,
    flaws: f.flaws.trim(),
    description: f.description.trim(),
    price_cents: f.priceCents,
    package_size: f.packageSize,
  };
}

/**
 * Publishes a listing whose photos the browser has already uploaded to
 * `<seller id>/<listing id>/` in Storage. Saves the ship-from address first
 * when the seller doesn't have one yet.
 */
export async function createListing(input: {
  id: string;
  fields: ListingFields;
  photoPaths: string[];
  agreedToRules: boolean;
  address?: ShipFromAddress;
}): Promise<ActionResult> {
  if (!isSupabaseConfigured) return { ok: false, error: "Listings save once Supabase is connected." };
  const user = await requireUser();
  if (user.suspended) return { ok: false, error: SUSPENDED };
  const supabase = await createClient();

  if (!UUID.test(input.id)) return { ok: false, error: "Something went wrong. Please try again." };
  const fieldError = checkFields(input.fields);
  if (fieldError) return { ok: false, error: fieldError };
  if (!input.agreedToRules) return { ok: false, error: "Confirm the item isn't on the banned list." };

  const folder = `${user.id}/${input.id}/`;
  const paths = input.photoPaths;
  if (paths.length < 1 || paths.length > MAX_PHOTOS || !paths.every((p) => p.startsWith(folder) && !p.includes("..")))
    return { ok: false, error: "Add between 1 and 10 photos." };
  if (input.fields.condition === "fair" && paths.length < 2)
    return { ok: false, error: "Fair condition needs a photo of the flaws." };

  const { data: existing } = await supabase
    .from("seller_addresses")
    .select("phone")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!normalizePhone(existing?.phone ?? "")) {
    if (!input.address) return { ok: false, error: "Add the address you'll ship from." };
    const addressError = checkAddress(input.address);
    if (addressError) return { ok: false, error: addressError };
    const a = input.address;
    const { error } = await supabase.from("seller_addresses").upsert({
      user_id: user.id,
      name: a.name.trim(),
      line1: a.line1.trim(),
      line2: a.line2.trim() || null,
      city: a.city.trim(),
      state: a.state.trim().toUpperCase(),
      zip: a.zip.trim(),
      phone: normalizePhone(a.phone),
      updated_at: new Date().toISOString(),
    });
    if (error) return { ok: false, error: "We couldn't save your address. Please try again." };
    // Buyers see the city and state on the listing.
    await supabase
      .from("profiles")
      .update({ city: a.city.trim(), state: a.state.trim().toUpperCase(), ship_from_zip: a.zip.trim() })
      .eq("id", user.id);
  }

  const { error: listingError } = await supabase.from("listings").insert({
    id: input.id,
    seller_id: user.id,
    ...columns(input.fields),
    banned_items_ack: true,
  });
  if (listingError) return { ok: false, error: "We couldn't save the listing. Please try again." };

  const title = input.fields.title.trim();
  const { error: photoError } = await supabase.from("listing_photos").insert(
    paths.map((storage_path, position) => ({
      listing_id: input.id,
      storage_path,
      position,
      alt: `${title}, photo ${position + 1}`,
    })),
  );
  if (photoError) {
    await supabase.from("listings").delete().eq("id", input.id);
    return { ok: false, error: "We couldn't save the photos. Please try again." };
  }

  updateTag(LISTINGS_TAG);
  return { ok: true, id: input.id };
}

/** Edit form on /listings/[id]/edit. Photos stay as they are. */
export async function updateListing(id: string, formData: FormData) {
  const user = await requireUser();
  const text = (name: string) => String(formData.get(name) ?? "");
  const price = Number.parseFloat(text("price").replace(/[^0-9.]/g, ""));
  const fields: ListingFields = {
    title: text("title"),
    brand: text("brand"),
    category: text("category"),
    subcategory: text("subcategory"),
    condition: text("condition"),
    flaws: text("flaws"),
    description: text("description"),
    priceCents: Number.isFinite(price) ? Math.round(price * 100) : 0,
    packageSize: text("packageSize"),
  };
  const fieldError = checkFields(fields);
  if (fieldError) redirect(`/listings/${id}/edit?error=${encodeURIComponent(fieldError)}`);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .update({ ...columns(fields), updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("seller_id", user.id)
    .select("id");
  if (error || !data?.length)
    redirect(`/listings/${id}/edit?error=${encodeURIComponent("That listing can't be edited.")}`);

  updateTag(LISTINGS_TAG);
  redirect("/dashboard?tab=listings&updated=1");
}

/** Pause hides a listing from browse and search; resume puts it back. */
export async function setListingPaused(id: string, paused: boolean) {
  const user = await requireUser();
  // A suspended seller can pause, but not put listings back on sale.
  if (user.suspended && !paused) redirect("/dashboard?tab=listings");
  const supabase = await createClient();
  await supabase
    .from("listings")
    .update({ status: paused ? "paused" : "active", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("seller_id", user.id)
    .in("status", ["active", "paused"]);
  updateTag(LISTINGS_TAG);
  redirect("/dashboard?tab=listings");
}

/** Deletes an unsold listing and its photos. */
export async function deleteListing(id: string) {
  const user = await requireUser();
  const supabase = await createClient();

  // Read the photo paths first: deleting the listing cascades to its photo rows.
  const { data: photos } = await supabase.from("listing_photos").select("storage_path").eq("listing_id", id);
  const { data, error } = await supabase
    .from("listings")
    .delete()
    .eq("id", id)
    .eq("seller_id", user.id)
    .in("status", ["active", "paused"])
    .select("id");
  if (!error && data?.length && photos?.length) {
    await supabase.storage.from(PHOTO_BUCKET).remove(photos.map((p) => p.storage_path));
  }

  updateTag(LISTINGS_TAG);
  redirect("/dashboard?tab=listings");
}

const REPORT_REASONS = ["It's a banned item", "Looks like a scam", "Wrong category or condition", "Something else"];

/** Any signed-in user can report a listing; it lands in the admin queue. */
export async function reportListing(listingId: string, formData: FormData) {
  const user = await requireUser();
  const reason = String(formData.get("reason") ?? "");
  const details = String(formData.get("details") ?? "")
    .trim()
    .slice(0, 2000);
  if (!REPORT_REASONS.includes(reason)) redirect(`/item/${listingId}/report?error=1`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("reports")
    .insert({ reporter_id: user.id, listing_id: listingId, reason, details: details || null });
  if (error) redirect(`/item/${listingId}/report?error=1`);
  redirect(`/item/${listingId}/report?sent=1`);
}
