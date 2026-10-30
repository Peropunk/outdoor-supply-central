import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ButtonLink } from "@/components/ui";
import { HELP_PAGES, getHelpPage } from "../content";

export function generateStaticParams() {
  return HELP_PAGES.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/help/[slug]">): Promise<Metadata> {
  const page = getHelpPage((await props.params).slug);
  return page ? { title: page.title, description: page.summary } : {};
}

export default async function HelpArticle(props: PageProps<"/help/[slug]">) {
  const page = getHelpPage((await props.params).slug);
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 pt-8">
      <Link href="/help" className="text-[15px]">
        ← Help
      </Link>
      <h1 className="mt-3 text-3xl sm:text-4xl">{page.title}</h1>
      <p className="mt-2 text-lg text-muted">{page.summary}</p>
      <div className="mt-8 space-y-4">{page.body}</div>
      {page.slug === "how-to-sell" && (
        <ButtonLink href="/sell" className="mt-10 w-full sm:w-auto">
          Sell your gear
        </ButtonLink>
      )}
    </article>
  );
}
