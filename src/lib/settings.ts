import "server-only";
import { createClient } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { DEFAULT_COMMISSION_RATE } from "./money";
import { isSupabaseConfigured, supabaseAnonKey, supabaseUrl } from "./supabase/config";

// Site settings that admins change (Chunk 6). Reads are cached for every
// visitor; saving a setting expires SETTINGS_TAG. Checkout reads the rate fresh
// (orders-server.ts commissionRate), so a sale always uses the current one.

export const SETTINGS_TAG = "settings";

/** The commission rate shown to sellers, e.g. 0.1 for 10%. */
export async function getCommissionRate(): Promise<number> {
  "use cache";
  cacheTag(SETTINGS_TAG);
  cacheLife("hours");
  if (!isSupabaseConfigured) return DEFAULT_COMMISSION_RATE;
  const db = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await db.from("settings").select("value").eq("key", "commission_rate").maybeSingle();
  const rate = Number(data?.value);
  return Number.isFinite(rate) && rate >= 0 && rate < 1 ? rate : DEFAULT_COMMISSION_RATE;
}
