"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, inputClass } from "@/components/ui";
import { ACTIVITIES } from "@/lib/catalog";

type Intent = "buying" | "selling" | "both";

const INTENTS: { id: Intent; label: string }[] = [
  { id: "buying", label: "Buying gear" },
  { id: "selling", label: "Selling gear" },
  { id: "both", label: "Both" },
];

export function Questionnaire() {
  const router = useRouter();
  const [intent, setIntent] = useState<Intent | "">("");
  const [activities, setActivities] = useState<string[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [zip, setZip] = useState("");
  const [error, setError] = useState("");

  const sells = intent === "selling" || intent === "both";

  function toggle(a: string) {
    setActivities((cur) => (cur.includes(a) ? cur.filter((x) => x !== a) : [...cur, a]));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!intent) return setError("Pick whether you're buying, selling or both.");
    if (sells && !/^\d{5}$/.test(zip)) return setError("Enter a 5-digit ZIP code so we can price shipping.");
    if (sells && displayName.trim().length < 2) return setError("Add a display name buyers will see.");
    // Chunk 2: save to `profiles` in Supabase.
    router.push(sells ? "/sell" : "/browse");
  }

  return (
    <form onSubmit={submit} className="mt-8 space-y-8">
      <fieldset>
        <legend className="text-lg font-semibold">1. What brings you here?</legend>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {INTENTS.map((i) => (
            <label
              key={i.id}
              className={`flex min-h-14 cursor-pointer items-center justify-center rounded-md border p-2 text-center ${
                intent === i.id ? "border-trail bg-trail text-white" : "border-line bg-paper"
              }`}
            >
              <input
                type="radio"
                name="intent"
                value={i.id}
                checked={intent === i.id}
                onChange={() => setIntent(i.id)}
                className="sr-only"
              />
              {i.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-lg font-semibold">2. Favourite activities</legend>
        <p className="text-[15px] text-muted">Pick any. We&apos;ll show you that gear first.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {ACTIVITIES.map((a) => {
            const on = activities.includes(a);
            return (
              <label
                key={a}
                className={`flex min-h-11 cursor-pointer items-center rounded-full border px-4 ${
                  on ? "border-pine bg-pine text-white" : "border-line bg-paper"
                }`}
              >
                <input type="checkbox" checked={on} onChange={() => toggle(a)} className="sr-only" />
                {a}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">3. Where do you ship from?</legend>
        {sells ? (
          <>
            <Field label="ZIP code" htmlFor="zip" hint="Kept private. We use it to price USPS shipping.">
              <input
                id="zip"
                inputMode="numeric"
                autoComplete="postal-code"
                maxLength={5}
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                className={inputClass}
              />
            </Field>
            <Field label="Display name" htmlFor="display-name" hint="Shown on your listings, e.g. “Maya R.”">
              <input
                id="display-name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className={inputClass}
              />
            </Field>
          </>
        ) : (
          <p className="text-muted">Only needed if you sell. You can add it later.</p>
        )}
      </fieldset>

      {error && (
        <p role="alert" className="font-semibold text-alert">
          {error}
        </p>
      )}
      <Button type="submit" className="w-full">
        Done
      </Button>
    </form>
  );
}
