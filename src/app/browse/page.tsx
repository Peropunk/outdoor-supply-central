import type { Metadata } from "next";
import Link from "next/link";
import { SearchBox } from "@/components/SearchBox";
import { ButtonLink, ListingGrid, buttonClass, inputClass } from "@/components/ui";
import { CATEGORIES, CONDITIONS, getCategory } from "@/lib/catalog";
import { searchListings, type ListingQuery } from "@/lib/listings";
import { dollarsToCents } from "@/lib/money";

export const metadata: Metadata = { title: "Shop used outdoor gear" };

const SORTS = [
  { id: "newest", label: "Newest" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
] as const;

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

export default async function BrowsePage(props: PageProps<"/browse">) {
  const sp = await props.searchParams;
  const q = one(sp.q)?.trim() || undefined;
  const category = getCategory(one(sp.category));
  const condition = CONDITIONS.find((c) => c.id === one(sp.condition))?.id;
  const min = one(sp.min);
  const max = one(sp.max);
  const sort = SORTS.find((s) => s.id === one(sp.sort))?.id ?? "newest";

  const query: ListingQuery = {
    q,
    category: category?.slug,
    condition,
    minPrice: min ? dollarsToCents(min) : undefined,
    maxPrice: max ? dollarsToCents(max) : undefined,
    sort,
  };
  const listings = await searchListings(query);

  const filters: Filters = { q, category: category?.slug, condition, min, max, sort };
  const heading = q ? `Results for “${q}”` : (category?.name ?? "All gear");

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8">
      <nav aria-label="Categories" className="-mx-4 overflow-x-auto px-4 pb-1 no-scrollbar">
        <ul className="flex gap-2">
          <li>
            <Chip href="/browse" active={!category}>
              All
            </Chip>
          </li>
          {CATEGORIES.map((c) => (
            <li key={c.slug}>
              <Chip href={`/browse?category=${c.slug}`} active={category?.slug === c.slug}>
                {c.name}
              </Chip>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl">{heading}</h1>
          <p className="mt-1 text-muted">
            {listings.length} {listings.length === 1 ? "item" : "items"}
            {category && !q && <> · {category.blurb}</>}
          </p>
        </div>
        <div className="w-full sm:max-w-sm">
          <SearchBox defaultValue={q} category={category?.slug} />
        </div>
      </div>

      <div className="mt-6 grid gap-8 lg:grid-cols-[240px_1fr]">
        <details className="rounded-[var(--radius-card)] border border-line bg-paper lg:hidden">
          <summary className="label-caps flex min-h-12 cursor-pointer items-center px-4 text-[14px] text-pine">
            Filter and sort
          </summary>
          <FilterForm id="m" {...filters} />
        </details>
        <aside
          className="hidden self-start rounded-[var(--radius-card)] border border-line bg-paper pt-4 lg:block"
          aria-label="Filter and sort"
        >
          <FilterForm id="d" {...filters} />
        </aside>

        <section aria-label="Results">
          {listings.length ? (
            <ListingGrid listings={listings} />
          ) : (
            <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-paper p-10 text-center">
              <p className="text-lg font-semibold">No gear matches yet.</p>
              <p className="mt-1 text-muted">Try fewer words or clear a filter. New gear is added every day.</p>
              <ButtonLink href="/browse" variant="outline" className="mt-5">
                See all gear
              </ButtonLink>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

type Filters = {
  q?: string;
  category?: string;
  condition?: string;
  min?: string;
  max?: string;
  sort: string;
};

function FilterForm({ id, q, category, condition, min, max, sort }: Filters & { id: string }) {
  return (
    <form action="/browse" className="space-y-5 px-4 pb-5">
      {q && <input type="hidden" name="q" value={q} />}
      <div className="space-y-1.5">
        <label htmlFor={`${id}-category`} className="block font-semibold">
          Category
        </label>
        <select id={`${id}-category`} name="category" defaultValue={category ?? ""} className={inputClass}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="space-y-1.5">
        <legend className="font-semibold">Condition</legend>
        <label className="flex min-h-10 items-center gap-2">
          <input type="radio" name="condition" value="" defaultChecked={!condition} className="size-5 accent-trail" />
          Any
        </label>
        {CONDITIONS.map((c) => (
          <label key={c.id} className="flex min-h-10 items-center gap-2">
            <input
              type="radio"
              name="condition"
              value={c.id}
              defaultChecked={condition === c.id}
              className="size-5 accent-trail"
            />
            {c.label}
          </label>
        ))}
      </fieldset>
      <fieldset>
        <legend className="font-semibold">Price</legend>
        <div className="mt-1.5 flex items-center gap-2">
          <label className="sr-only" htmlFor={`${id}-min`}>
            Minimum price
          </label>
          <input
            id={`${id}-min`}
            name="min"
            inputMode="decimal"
            placeholder="$ min"
            defaultValue={min}
            className={inputClass}
          />
          <span aria-hidden="true">–</span>
          <label className="sr-only" htmlFor={`${id}-max`}>
            Maximum price
          </label>
          <input
            id={`${id}-max`}
            name="max"
            inputMode="decimal"
            placeholder="$ max"
            defaultValue={max}
            className={inputClass}
          />
        </div>
      </fieldset>
      <div className="space-y-1.5">
        <label htmlFor={`${id}-sort`} className="block font-semibold">
          Sort by
        </label>
        <select id={`${id}-sort`} name="sort" defaultValue={sort} className={inputClass}>
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <button type="submit" className={buttonClass("primary", "w-full")}>
        Show results
      </button>
      <Link href="/browse" className="block text-center text-[15px]">
        Clear all
      </Link>
    </form>
  );
}

function Chip({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex min-h-11 items-center rounded-full border px-4 whitespace-nowrap no-underline ${
        active ? "border-pine bg-pine text-white" : "border-line bg-paper text-ink hover:border-trail"
      }`}
    >
      {children}
    </Link>
  );
}
