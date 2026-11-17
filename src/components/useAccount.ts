"use client";

import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { getBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export type Account = { name: string; admin: boolean } | null;

/**
 * Who is signed in, for the header and phone menu. The header is shared by
 * every page and cached, so it can't ask the server; this reads the session
 * the browser already holds and follows sign-in and sign-out. `undefined`
 * means "not known yet", so nothing flickers while it loads.
 */
export function useAccount(): Account | undefined {
  const [account, setAccount] = useState<Account | undefined>(undefined);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const supabase = getBrowserClient();
    let cancelled = false;

    async function load(userId: string | undefined, email: string | undefined) {
      if (!userId) {
        if (!cancelled) setAccount(null);
        return;
      }
      const { data } = await supabase.from("profiles").select("display_name, role").eq("id", userId).maybeSingle();
      if (!cancelled) {
        setAccount({ name: data?.display_name || email?.split("@")[0] || "You", admin: data?.role === "admin" });
      }
    }

    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => load(data.session?.user.id, data.session?.user.email));
    const { data: sub } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      load(session?.user.id, session?.user.email);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return account;
}
