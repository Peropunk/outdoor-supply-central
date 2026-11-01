// Until JD's Supabase project exists the site runs in preview mode: sample
// data, and sign-in buttons skip ahead. Filling in .env.local switches it on.
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
