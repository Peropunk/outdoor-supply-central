import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { Card, buttonClass, inputClass } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { adminSetSuspended } from "../actions";
import { AdminNav } from "../AdminNav";

export const metadata: Metadata = { title: "Admin: users", robots: { index: false } };

const dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });

type Profile = {
  id: string;
  display_name: string;
  city: string | null;
  state: string | null;
  role: string;
  suspended_at: string | null;
  payouts_enabled: boolean;
};

/** Members, newest first, searchable by email or display name. */
export default async function AdminUsersPage(props: PageProps<"/admin/users">) {
  const me = await requireAdmin();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase().slice(0, 100) : "";
  const db = createAdminClient();

  const { data: auth } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const accounts = (auth?.users ?? []).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const { data: profiles } = await db
    .from("profiles")
    .select("id, display_name, city, state, role, suspended_at, payouts_enabled")
    .in(
      "id",
      accounts.map((a) => a.id),
    );
  const byId = new Map(((profiles ?? []) as Profile[]).map((p) => [p.id, p]));
  const rows = accounts
    .map((a) => ({ account: a, profile: byId.get(a.id) }))
    .filter(
      ({ account, profile }) =>
        !q || account.email?.toLowerCase().includes(q) || profile?.display_name.toLowerCase().includes(q),
    )
    .slice(0, 100);
  const backTo = q ? `/admin/users?q=${encodeURIComponent(q)}` : "/admin/users";

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8">
      <AdminNav current="/admin/users" msg={sp.msg} />

      <form action="/admin/users" role="search" className="mt-6 flex gap-2">
        <label htmlFor="q" className="sr-only">
          Find a member
        </label>
        <input id="q" name="q" defaultValue={q} placeholder="Email or display name" className={inputClass} />
        <button type="submit" className={buttonClass("primary", "shrink-0 px-4")} aria-label="Search members">
          <Search className="size-5" aria-hidden="true" />
        </button>
      </form>

      <div className="mt-6 space-y-3">
        {!rows.length && <p className="text-muted">No members match.</p>}
        {rows.map(({ account, profile }) => {
          const suspended = Boolean(profile?.suspended_at);
          return (
            <Card key={account.id} className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <div className="min-w-0 flex-1 basis-56">
                <p className="font-semibold">
                  {profile?.display_name || "No name yet"}
                  {profile?.role === "admin" && (
                    <span className="ml-2 rounded-full bg-pine px-2 py-0.5 text-[13px] text-white">Admin</span>
                  )}
                  {suspended && (
                    <span className="ml-2 rounded-full bg-alert px-2 py-0.5 text-[13px] text-white">Suspended</span>
                  )}
                </p>
                <p className="text-[15px] break-all">{account.email}</p>
                <p className="text-[14px] text-muted">
                  {[profile?.city, profile?.state].filter(Boolean).join(", ") || "No city"} · joined{" "}
                  {dayFmt.format(new Date(account.created_at))} ·{" "}
                  {profile?.payouts_enabled ? "payouts set up" : "no payouts"}
                </p>
                <Link href={`/admin?q=${encodeURIComponent(account.email ?? "")}`} className="text-[14px]">
                  Their orders
                </Link>
              </div>
              {profile && profile.role !== "admin" && account.id !== me.id && (
                <form action={adminSetSuspended.bind(null, account.id, !suspended)}>
                  <input type="hidden" name="back" value={backTo} />
                  <button
                    type="submit"
                    className={
                      suspended
                        ? buttonClass("outline", "min-h-10")
                        : "label-caps inline-flex min-h-10 items-center rounded-md border border-alert/40 px-4 text-[14px] text-alert hover:bg-alert/5"
                    }
                  >
                    {suspended ? "Lift suspension" : "Suspend"}
                  </button>
                </form>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
