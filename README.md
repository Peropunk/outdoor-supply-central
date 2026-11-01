# Outdoor Supply Central

The used-gear marketplace for Outdoor Central, LLC, built against the Phase 1 work plan
(`../Outdoor Supply Central Phase 1 Work Plan.md`).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build
npm run lint
```

Stack: Next.js 16 (App Router, Cache Components), TypeScript, Tailwind CSS 4, Supabase (Postgres, Auth,
Storage). Stripe Connect and Shippo get connected in Chunks 4 and 5.

Without Supabase keys the site runs in preview mode on sample data. To connect it, follow [SETUP.md](SETUP.md).

## Where things are

| Path | What |
| --- | --- |
| `src/app/globals.css` | Design tokens: palette, Jost/Inter type, base styles |
| `src/components/ui.tsx` | Shared components: buttons, listing card, condition badge, status bar, fields |
| `src/components/MountainArt.tsx` | SVG mountain-and-pine band (stand-in for JD's original art) |
| `src/lib/catalog.ts` | Categories, condition grades, package sizes, banned items, ship-by days |
| `src/lib/money.ts` | Commission (10% placeholder) and "You earn" maths, in cents |
| `src/lib/listings.ts`, `src/lib/orders.ts` | **Sample data** behind async functions; swap for Supabase queries |
| `supabase/migrations/0001_init.sql` | Phase 1 data model with row level security |
| `supabase/migrations/0002_storage.sql` | Listing-photo storage bucket and upload rules |
| `src/lib/supabase/`, `src/proxy.ts` | Supabase clients and per-request session refresh |
| `src/lib/auth.ts`, `src/app/auth/` | Current user, sign-in, welcome, account and sign-out actions, link callback |

## Screens

Home `/`, Browse and search `/browse`, Item `/item/[id]`, Sell in 4 steps `/sell`, Checkout `/checkout/[id]`,
Order tracking `/orders/[number]` (add `?view=seller` for the seller's side), Report a problem, Seller dashboard
`/dashboard`, Sign in `/signin`, 3-question welcome `/welcome`, Account `/account`, Help and policies `/help`.

Screens that need sign-in, payments or the database show a dashed **Preview** note and run on sample data.

## Open items

- JD's original logo (transparent PNG or SVG) and mountain illustration files
- Facebook, YouTube and TikTok URLs for the footer
- The 11 decisions in the work plan; the code builds the defaults
- Terms of use and privacy policy text
