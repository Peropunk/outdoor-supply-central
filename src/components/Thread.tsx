import type { ThreadMessage } from "@/lib/messages";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

/** An order's problem thread, oldest message first. Used on the order's problem page and in admin. */
export function Thread({ messages }: { messages: ThreadMessage[] }) {
  return (
    <ol className="space-y-3" aria-label="Messages">
      {messages.map((m) => (
        <li
          key={m.id}
          className={`rounded-[var(--radius-card)] border p-4 ${
            m.side === "admin" ? "border-pine/40 bg-pine/5" : m.mine ? "border-line bg-sand" : "border-line bg-paper"
          }`}
        >
          <p className="flex flex-wrap justify-between gap-x-3 text-[14px]">
            <span className={`font-semibold ${m.side === "admin" ? "text-pine" : "text-ink"}`}>
              {m.mine ? "You" : m.authorName}
            </span>
            <time dateTime={m.at} className="text-muted">
              {dateFmt.format(new Date(m.at))}
            </time>
          </p>
          <p className="mt-1 whitespace-pre-line">{m.body}</p>
          {m.photos.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {m.photos.map((src, i) => (
                <a key={src} href={src} target="_blank" rel="noopener noreferrer" className="block">
                  {/* Photos people add to a thread, shown full size on tap. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`Photo ${i + 1} from ${m.mine ? "you" : m.authorName}`}
                    className="size-24 rounded-md border border-line object-cover"
                  />
                </a>
              ))}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}
