// Shown while a page that reads the URL or the database streams in. Header
// and footer stay on screen from the static shell.
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 pt-8" aria-busy="true" aria-label="Loading">
      <div className="h-9 w-56 rounded bg-sand" />
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i}>
            <div className="aspect-square rounded-[var(--radius-card)] bg-sand" />
            <div className="mt-2 h-5 w-16 rounded bg-sand" />
            <div className="mt-1.5 h-4 w-full rounded bg-sand" />
          </div>
        ))}
      </div>
    </div>
  );
}
