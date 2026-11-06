"use client";

import { useState } from "react";
import { StreetAddressInput } from "@/components/StreetAddressInput";
import { Field, inputClass } from "@/components/ui";

export type SavedAddress = {
  name: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
};

/** The ship-from fields on the account page. Picking a suggestion fills city, state and ZIP. */
export function AddressFields({ address, fallbackZip }: { address: SavedAddress | null; fallbackZip: string }) {
  const [a, setA] = useState({
    line1: address?.line1 ?? "",
    city: address?.city ?? "",
    state: address?.state ?? "",
    zip: address?.zip ?? fallbackZip,
  });
  const set = (patch: Partial<typeof a>) => setA((prev) => ({ ...prev, ...patch }));

  return (
    <>
      <Field label="Name on labels" htmlFor="name">
        <input id="name" name="name" autoComplete="name" defaultValue={address?.name} className={inputClass} />
      </Field>
      <Field label="Street address" htmlFor="line1">
        <StreetAddressInput
          id="line1"
          name="line1"
          autoComplete="address-line1"
          value={a.line1}
          onChange={(line1) => set({ line1 })}
          onPick={set}
        />
      </Field>
      <Field label="Apartment, suite (optional)" htmlFor="line2">
        <input
          id="line2"
          name="line2"
          autoComplete="address-line2"
          defaultValue={address?.line2 ?? ""}
          className={inputClass}
        />
      </Field>
      <Field label="Phone" htmlFor="phone" hint="USPS requires it for labels. Buyers never see it.">
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          defaultValue={address?.phone ?? ""}
          className={inputClass}
        />
      </Field>
      <div className="grid grid-cols-[1fr_80px_110px] gap-3">
        <Field label="City" htmlFor="city">
          <input
            id="city"
            name="city"
            autoComplete="address-level2"
            value={a.city}
            onChange={(e) => set({ city: e.target.value })}
            className={inputClass}
          />
        </Field>
        <Field label="State" htmlFor="state">
          <input
            id="state"
            name="state"
            autoComplete="address-level1"
            maxLength={2}
            value={a.state}
            onChange={(e) => set({ state: e.target.value.toUpperCase() })}
            className={inputClass}
          />
        </Field>
        <Field label="ZIP" htmlFor="zip">
          <input
            id="zip"
            name="zip"
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            value={a.zip}
            onChange={(e) => set({ zip: e.target.value.replace(/\D/g, "") })}
            className={inputClass}
          />
        </Field>
      </div>
    </>
  );
}
