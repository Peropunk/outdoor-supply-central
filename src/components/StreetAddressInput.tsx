"use client";

import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type KeyboardEvent } from "react";
import { MapPin } from "lucide-react";
import { inputClass } from "@/components/ui";

// Street address field with US address suggestions from Geoapify. Picking a
// suggestion fills the city, state and ZIP too. Without NEXT_PUBLIC_GEOAPIFY_KEY
// it is a plain text field. The key is public by design; it is locked to this
// site's addresses in the Geoapify dashboard.

const KEY = process.env.NEXT_PUBLIC_GEOAPIFY_KEY;
const MIN_CHARS = 4;
const WAIT_MS = 300;

export type PickedAddress = { line1: string; city: string; state: string; zip: string };
type Suggestion = PickedAddress & { id: string; label: string };

type Result = {
  place_id: string;
  housenumber?: string;
  street?: string;
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  suburb?: string;
  state_code?: string;
  postcode?: string;
};

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "className"> & {
  value: string;
  onChange: (line1: string) => void;
  onPick: (address: PickedAddress) => void;
};

export function StreetAddressInput({ value, onChange, onPick, onKeyDown, onBlur, ...rest }: Props) {
  const listId = useId();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const request = useRef<AbortController>(undefined);
  const lastText = useRef("");

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      request.current?.abort();
    },
    [],
  );

  function search(text: string) {
    // Each lookup counts against the free daily allowance, so skip repeats (a trailing space, say).
    if (text.trim() === lastText.current) return;
    lastText.current = text.trim();
    clearTimeout(timer.current);
    request.current?.abort();
    if (!KEY || text.trim().length < MIN_CHARS) {
      setItems([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      const controller = new AbortController();
      request.current = controller;
      try {
        const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
        url.search = new URLSearchParams({
          text: text.trim(),
          filter: "countrycode:us",
          format: "json",
          lang: "en",
          limit: "5",
          apiKey: KEY,
        }).toString();
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) return;
        const data: { results?: Result[] } = await res.json();
        const found = toSuggestions(data.results ?? [], text);
        setItems(found);
        setActive(-1);
        setOpen(found.length > 0);
      } catch {
        // Aborted or offline: the field still works as plain text.
      }
    }, WAIT_MS);
  }

  function pick(s: Suggestion) {
    clearTimeout(timer.current);
    request.current?.abort();
    lastText.current = s.line1;
    onPick({ line1: s.line1, city: s.city, state: s.state, zip: s.zip });
    setItems([]);
    setOpen(false);
  }

  function handleKey(e: KeyboardEvent<HTMLInputElement>) {
    onKeyDown?.(e);
    if (!open || !items.length) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      pick(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && items.length > 0;

  return (
    <div className="relative">
      <input
        {...rest}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          search(e.target.value);
        }}
        onKeyDown={handleKey}
        onBlur={(e) => {
          onBlur?.(e);
          setOpen(false);
        }}
        role={KEY ? "combobox" : undefined}
        aria-autocomplete={KEY ? "list" : undefined}
        aria-expanded={KEY ? showList : undefined}
        aria-controls={KEY ? listId : undefined}
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        className={inputClass}
      />
      {showList && (
        <div className="absolute inset-x-0 top-full z-40 mt-1 overflow-hidden rounded-md border border-line bg-paper shadow-lg">
          <ul id={listId} role="listbox" aria-label="Address suggestions">
            {items.map((s, i) => (
              <li
                key={s.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown so the pick lands before the field's blur closes the list
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-start gap-2 px-3 py-3 ${i === active ? "bg-sand" : ""}`}
              >
                <MapPin className="mt-1 size-4 shrink-0 text-trail" aria-hidden="true" />
                <span>{s.label}</span>
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-3 py-1 text-right text-[12px] text-muted">Powered by Geoapify</p>
        </div>
      )}
    </div>
  );
}

/** Street-level results, with the house number the person typed if Geoapify didn't return one. */
function toSuggestions(results: Result[], typed: string): Suggestion[] {
  const typedNumber = typed.trim().match(/^\d+[A-Za-z]?(?=\s)/)?.[0];
  const seen = new Set<string>();
  const out: Suggestion[] = [];
  for (const r of results) {
    if (!r.street) continue;
    const number = r.housenumber ?? typedNumber;
    const line1 = number ? `${number} ${r.street}` : r.street;
    const city = r.city ?? r.town ?? r.village ?? r.hamlet ?? r.suburb ?? "";
    const state = (r.state_code ?? "").toUpperCase();
    const zip = (r.postcode ?? "").slice(0, 5);
    const label = [line1, city, [state, zip].filter(Boolean).join(" ")].filter(Boolean).join(", ");
    if (seen.has(label)) continue;
    seen.add(label);
    out.push({ id: r.place_id, label, line1, city, state, zip });
  }
  return out;
}
