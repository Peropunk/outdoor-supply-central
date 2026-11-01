# Connecting Supabase

The site runs in **preview mode** until `.env.local` has Supabase keys: sample data, and the sign-in buttons
skip ahead. These steps switch on real sign-in, the welcome questions and account settings (Chunk 2). Open every
account in JD's name.

## 1. Create the project

1. Sign in at [supabase.com](https://supabase.com) and create a project named `outdoor-supply-central`.
2. Pick a US region close to most buyers (for example East US). Save the database password in a password manager.

## 2. Create the tables

Run the migrations in order, either way:

- **Dashboard:** SQL Editor → New query → paste [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql)
  → Run. Then do the same with [`0002_storage.sql`](supabase/migrations/0002_storage.sql).
- **CLI:** run `npx supabase link --project-ref <project ref>` and then `npx supabase db push` from this folder.

## 3. Sign-in settings

Authentication → URL Configuration:

- **Site URL:** the staging address for now, later `https://outdoorsupplycentral.com`
- **Redirect URLs:** add each place the site runs, ending in `/auth/callback`:
  - `http://localhost:3000/auth/callback`
  - `https://<staging>.vercel.app/auth/callback`
  - `https://outdoorsupplycentral.com/auth/callback`

Authentication → Sign In / Providers → **Email**: leave it on. This sends the sign-in links.

> Supabase's built-in mailer only sends a few emails an hour. That's fine for testing. Before launch, Chunk 4
> points it at Resend or Postmark on JD's domain (Authentication → Emails → SMTP settings).

## 4. Google sign-in (optional for testing)

1. In [Google Cloud Console](https://console.cloud.google.com), create a project, then APIs & Services → OAuth
   consent screen (External, app name "Outdoor Supply Central").
2. Credentials → Create credentials → OAuth client ID → Web application.
   - **Authorized redirect URI:** `https://<project ref>.supabase.co/auth/v1/callback`
3. Copy the client ID and secret into Supabase → Authentication → Sign In / Providers → **Google**.

Email links work without this step.

## 5. Add the keys

Copy [`.env.example`](.env.example) to `.env.local` and fill it in from Supabase → Project Settings → API Keys.
`.env.local` is never committed. Keep the service role (secret) key out of chat and email.

Restart `npm run dev`. The "Preview" notes on the sign-in and account pages disappear once it's connected.

## 6. Make JD an admin

After JD signs in once, run this in the SQL Editor with his email:

```sql
update profiles set role = 'admin'
where id = (select id from auth.users where email = 'jd@example.com');
```

## 7. Staging on Vercel

Import the GitHub repo in Vercel, set **Root Directory** to `web`, and add the same three variables plus
`NEXT_PUBLIC_SITE_URL` (the staging address) under Settings → Environment Variables. Every push then gets its
own preview link.

## What's live after this

| Works with Supabase connected | Still sample data |
| --- | --- |
| Google and email-link sign-in, new-user welcome questions | Listings, browse, search, item pages (Chunk 3) |
| Account settings: name, email, ship-from address, sign out, delete account | Checkout, orders, dashboard (Chunks 4–6) |
| Session refresh on every request | |
