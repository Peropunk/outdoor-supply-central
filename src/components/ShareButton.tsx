"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

/**
 * Shares a page with the phone's own share sheet (Messages, WhatsApp,
 * Facebook…), or copies the link on computers without one.
 */
export function ShareButton({ title, text, className = "" }: { title: string; text?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href.split("?")[0];
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch (error) {
        // Closing the share sheet isn't an error worth reporting.
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={`flex items-center gap-1.5 text-[15px] text-muted hover:text-pine ${className}`}
    >
      {copied ? (
        <Check className="size-4 text-trail" aria-hidden="true" />
      ) : (
        <Share2 className="size-4" aria-hidden="true" />
      )}
      <span aria-live="polite">{copied ? "Link copied" : "Share"}</span>
    </button>
  );
}
