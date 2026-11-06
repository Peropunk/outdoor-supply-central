"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { buttonClass } from "./ui";

export function MobileMenu({ items }: { items: { href: string; label: string }[] }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex size-12 items-center justify-center rounded-md text-ink hover:bg-sand"
      >
        <Menu className="size-6" aria-hidden="true" />
      </button>
      {/* Portalled to <body>: the header's backdrop blur would otherwise trap this
          full-screen overlay inside the 64px header, leaving the links see-through. */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-50 bg-ink/40" onClick={() => setOpen(false)}>
            <nav
              aria-label="Phone menu"
              className="ml-auto flex h-full w-[85%] max-w-sm flex-col bg-paper p-4 shadow-xl"
              onClick={(e) => {
                e.stopPropagation();
                if ((e.target as HTMLElement).closest("a")) setOpen(false);
              }}
            >
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="ml-auto flex size-12 items-center justify-center rounded-md hover:bg-sand"
              >
                <X className="size-6" aria-hidden="true" />
              </button>
              <ul className="mt-2 divide-y divide-line">
                {[
                  ...items,
                  { href: "/dashboard", label: "My dashboard" },
                  { href: "/account", label: "My account" },
                  { href: "/signin", label: "Sign in" },
                ].map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="block py-4 text-lg text-ink no-underline">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-auto grid gap-3 pb-4">
                <Link href="/browse" className={buttonClass("secondary")}>
                  Buy gear
                </Link>
                <Link href="/sell" className={buttonClass("primary")}>
                  Sell gear
                </Link>
              </div>
            </nav>
          </div>,
          document.body,
        )}
    </div>
  );
}
