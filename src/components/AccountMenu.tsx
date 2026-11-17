"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LayoutDashboard, LogOut, Settings, Shield, User } from "lucide-react";
import { getBrowserClient } from "@/lib/supabase/client";
import { useAccount } from "./useAccount";

/** Signs out in the browser and on the server, then starts fresh on the home page. */
export async function signOutEverywhere() {
  try {
    await getBrowserClient().auth.signOut();
  } finally {
    // A full reload on purpose, so nothing from the signed-in session lingers in the page.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/");
  }
}

const itemClass = "flex min-h-11 items-center gap-3 rounded-md px-3 text-ink no-underline hover:bg-sand";

/** Header account button: "Sign in" when signed out, a menu with the member's initial when signed in. */
export function AccountMenu() {
  const account = useAccount();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  // Not known yet: the plain account icon, so the header doesn't jump.
  if (account === undefined) {
    return (
      <Link
        href="/account"
        aria-label="Your account"
        className="flex size-12 items-center justify-center rounded-md text-ink hover:bg-sand"
      >
        <User className="size-6" aria-hidden="true" />
      </Link>
    );
  }

  if (account === null) {
    return (
      <Link
        href="/signin"
        className="label-caps flex min-h-12 items-center rounded-md px-3 text-[14px] text-ink no-underline hover:text-pine"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${account.name}`}
        className="flex size-12 items-center justify-center rounded-md hover:bg-sand"
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-pine font-semibold text-white uppercase">
          {account.name.charAt(0)}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-1 w-60 rounded-[var(--radius-card)] border border-line bg-paper p-2 shadow-lg"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest("a")) setOpen(false);
          }}
        >
          <p className="truncate px-3 pt-1 pb-2 text-[14px] text-muted">Signed in as {account.name}</p>
          <Link role="menuitem" href="/dashboard" className={itemClass}>
            <LayoutDashboard className="size-5 text-trail" aria-hidden="true" /> My dashboard
          </Link>
          <Link role="menuitem" href="/account" className={itemClass}>
            <Settings className="size-5 text-trail" aria-hidden="true" /> Account settings
          </Link>
          {account.admin && (
            <Link role="menuitem" href="/admin" className={itemClass}>
              <Shield className="size-5 text-trail" aria-hidden="true" /> Admin
            </Link>
          )}
          <button type="button" role="menuitem" onClick={signOutEverywhere} className={`${itemClass} w-full`}>
            <LogOut className="size-5 text-trail" aria-hidden="true" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
