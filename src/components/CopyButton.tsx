"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/** Copies a value, such as a tracking number, with a short "Copied" confirmation. */
export function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          window.prompt("Copy:", value);
        }
      }}
      aria-label={label}
      className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-[14px] text-muted hover:bg-sand hover:text-pine"
    >
      {copied ? (
        <Check className="size-4 text-trail" aria-hidden="true" />
      ) : (
        <Copy className="size-4" aria-hidden="true" />
      )}
      <span aria-live="polite">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}
