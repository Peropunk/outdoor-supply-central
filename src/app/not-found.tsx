import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 pt-16 text-center">
      <h1 className="text-3xl">Off the trail</h1>
      <p className="mt-2 text-muted">We couldn&apos;t find that page. The item may have sold or been removed.</p>
      <ButtonLink href="/browse" className="mt-6">
        Browse gear
      </ButtonLink>
    </div>
  );
}
