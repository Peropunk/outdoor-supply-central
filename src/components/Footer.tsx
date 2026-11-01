import Link from "next/link";
import { CATEGORIES } from "@/lib/catalog";
import { MountainArt } from "./MountainArt";
import { ButtonLink } from "./ui";

// JD to supply the account URLs; the old site linked Facebook, YouTube and TikTok.
const SOCIAL = [
  { label: "Facebook", href: "#" },
  { label: "YouTube", href: "#" },
  { label: "TikTok", href: "#" },
];

export function Footer() {
  return (
    <footer className="mt-20">
      <section className="relative isolate overflow-hidden">
        <MountainArt className="absolute inset-0 -z-10 h-full w-full" />
        <div className="mx-auto max-w-3xl px-4 pt-14 pb-40 text-center sm:pb-48">
          <h2 className="label-caps text-2xl text-ink sm:text-4xl">Give your gear a second life</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Sell your camping, hiking, fishing and survival gear to fellow outdoor people.
          </p>
          <ButtonLink href="/sell" className="mt-6">
            Sell your gear
          </ButtonLink>
        </div>
      </section>

      <div className="bg-pine text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-3">
          <div>
            <p className="label-caps text-sm text-white/70">Shop</p>
            <ul className="mt-3 space-y-2">
              {CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link href={`/browse?category=${c.slug}`} className="text-white no-underline hover:underline">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label-caps text-sm text-white/70">Help</p>
            <ul className="mt-3 space-y-2">
              {[
                ["/help/how-to-sell", "How to sell in 5 steps"],
                ["/help/fees", "Fees"],
                ["/help/shipping", "Shipping rules"],
                ["/help/conditions", "Condition grades"],
                ["/help/banned-items", "Banned items"],
                ["/help/terms", "Terms of use"],
                ["/help/privacy", "Privacy policy"],
              ].map(([href, label]) => (
                <li key={href}>
                  <Link href={href} className="text-white no-underline hover:underline">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="label-caps text-sm text-white/70">Follow along</p>
            <ul className="mt-3 space-y-2">
              {SOCIAL.map((s) => (
                <li key={s.label}>
                  <a href={s.href} className="text-white no-underline hover:underline">
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-6 font-heading text-2xl">#GetOutMore</p>
          </div>
        </div>
        <div className="border-t border-white/15">
          <p className="mx-auto max-w-6xl px-4 py-5 text-sm text-white/75">
            © Outdoor Central, LLC · outdoorsupplycentral.com
          </p>
        </div>
      </div>
    </footer>
  );
}
