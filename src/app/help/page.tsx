import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageTitle } from "@/components/ui";
import { getHelpPages } from "./content";

export const metadata: Metadata = { title: "Help" };

export default async function HelpIndex() {
  const pages = await getHelpPages();
  return (
    <div className="mx-auto max-w-2xl px-4 pt-8">
      <PageTitle sub="Fees, shipping, condition grades and the house rules.">Help</PageTitle>
      <ul className="divide-y divide-line rounded-[var(--radius-card)] border border-line bg-paper">
        {pages.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/help/${p.slug}`}
              className="flex items-center gap-4 px-5 py-4 text-ink no-underline hover:bg-sand"
            >
              <div className="flex-1">
                <p className="font-semibold">{p.title}</p>
                <p className="text-[15px] text-muted">{p.summary}</p>
              </div>
              <ChevronRight className="size-5 text-muted" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
