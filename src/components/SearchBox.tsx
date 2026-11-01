import { Search } from "lucide-react";
import { inputClass } from "./ui";

/** Plain GET form so search works before any JavaScript loads. */
export function SearchBox({ defaultValue, category }: { defaultValue?: string; category?: string }) {
  return (
    <form action="/browse" role="search" className="relative">
      <label htmlFor="q" className="sr-only">
        Search gear
      </label>
      <input
        id="q"
        name="q"
        type="search"
        defaultValue={defaultValue}
        placeholder="Search tents, boots, reels…"
        className={`${inputClass} pr-14 shadow-sm`}
      />
      {category && <input type="hidden" name="category" value={category} />}
      <button
        type="submit"
        aria-label="Search"
        className="absolute top-1/2 right-1 flex size-10 -translate-y-1/2 items-center justify-center rounded-md bg-pine text-white hover:bg-pine-dark"
      >
        <Search className="size-5" aria-hidden="true" />
      </button>
    </form>
  );
}
