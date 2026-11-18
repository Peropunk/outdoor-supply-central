import type { Metadata } from "next";

export const metadata: Metadata = { title: "Not available in your region", robots: { index: false } };

/** Shown instead of the site to visitors from regions Stripe's policy restricts (see proxy.ts). */
export default function Unavailable() {
  return (
    <div className="mx-auto max-w-xl px-4 pt-16 text-center">
      <h1 className="text-3xl">Not available in your region</h1>
      <p className="mt-3 text-muted">
        Outdoor Supply Central is a marketplace for buyers and sellers in the United States. Buying, selling and
        payments aren&apos;t available where you are.
      </p>
    </div>
  );
}
