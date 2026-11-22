import type { Metadata } from "next";
import { BackpackMark } from "@/components/BackpackMark";
import { ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Outdoor Supply Central is where pre-owned camping, hiking, fishing, and survival gear gets a second life, bought and sold by people who actually use it.",
};

/** JD's story and mission, from his original site. */
export default function AboutPage() {
  return (
    <article className="mx-auto max-w-2xl px-4 pt-10">
      <BackpackMark className="size-24 text-pine" title="Outdoor Supply Central" />
      <p className="label-caps mt-6 text-[14px] text-olive">Our mission</p>
      <h1 className="mt-2 text-3xl leading-tight sm:text-4xl">Where pre-owned outdoor gear gets a second life</h1>
      <div className="mt-6 space-y-5 text-lg">
        <p>
          Outdoor Supply Central is where pre-owned camping, hiking, fishing, and survival gear gets a second
          life&mdash;bought and sold by people who actually use it.
        </p>
        <p>
          My mother raised me on one rule: an ounce of prevention is worth a pound of cure. Being prepared before
          setting foot outside the house was never optional when growing up&mdash;it was the whole point.
        </p>
        <p>
          That mindset built this marketplace. Great gear shouldn&rsquo;t sit unused when it could be on your next trip.
          We&rsquo;re here to help outdoor enthusiasts gear up, spend less, and stay ready for whatever the trail throws
          at them.
        </p>
        <p className="font-heading text-2xl font-semibold text-pine">Buy smart. Sell easy. Stay prepared.</p>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/browse">Shop pre-owned gear</ButtonLink>
        <ButtonLink href="/sell" variant="outline">
          Sell your gear
        </ButtonLink>
      </div>
    </article>
  );
}
