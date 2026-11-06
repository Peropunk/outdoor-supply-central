import Link from "next/link";
import { CircleCheck } from "lucide-react";
import { createAdminClient } from "@/lib/supabase/server";

const SECTIONS = [
  { href: "/admin", label: "Orders" },
  { href: "/admin/listings", label: "Listings" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/settings", label: "Settings" },
] as const;

/** Admin section tabs, with the open-report count, and the result of the last action. */
export async function AdminNav({ current, msg }: { current: (typeof SECTIONS)[number]["href"]; msg?: unknown }) {
  const { count } = await createAdminClient()
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");

  return (
    <>
      <p className="label-caps text-[13px] text-olive">Admin</p>
      <nav aria-label="Admin sections" className="-mx-4 mt-2 overflow-x-auto border-b border-line px-4 no-scrollbar">
        <ul className="flex gap-1">
          {SECTIONS.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                aria-current={current === s.href ? "page" : undefined}
                className={`flex min-h-12 items-center gap-2 border-b-[3px] px-3 whitespace-nowrap no-underline ${
                  current === s.href ? "border-pine font-semibold text-pine" : "border-transparent text-muted"
                }`}
              >
                {s.label}
                {s.href === "/admin/reports" && Boolean(count) && (
                  <span className="rounded-full bg-boot px-2 text-[13px] font-semibold text-white">{count}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {typeof msg === "string" && msg && (
        <p role="status" className="mt-6 flex items-center gap-2 rounded-md bg-pine px-4 py-3 text-white">
          <CircleCheck className="size-5 shrink-0" aria-hidden="true" /> {msg}
        </p>
      )}
    </>
  );
}
