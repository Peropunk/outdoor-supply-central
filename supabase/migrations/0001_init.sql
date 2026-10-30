-- Outdoor Supply Central: Phase 1 data model (Chunk 2).
-- users (auth.users, managed by Supabase Auth), profiles, listings, photos,
-- orders, payouts, order messages, reports, settings.
-- Money is stored in cents. Row level security is on for every table; the
-- server uses the service role for webhooks (Stripe, Shippo) and admin work.

create extension if not exists pg_trgm;

-- Enums ---------------------------------------------------------------------

create type user_intent as enum ('buying', 'selling', 'both');
create type user_role as enum ('member', 'admin');
create type listing_category as enum ('camping', 'hiking', 'fishing', 'survival', 'clothing-footwear', 'other');
create type listing_condition as enum ('new', 'like-new', 'good', 'fair');
create type listing_status as enum ('active', 'reserved', 'sold', 'paused', 'removed');
create type package_size as enum ('small', 'medium', 'large', 'xlarge');
create type order_status as enum ('pending_payment', 'paid', 'label_ready', 'shipped', 'delivered', 'cancelled', 'refunded');
create type payout_status as enum ('held', 'transferred', 'reversed');
create type report_status as enum ('open', 'resolved', 'dismissed');

-- Profiles ------------------------------------------------------------------

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  city text,
  state text,
  intent user_intent,
  activities text[] not null default '{}',
  role user_role not null default 'member',
  suspended_at timestamptz,
  stripe_account_id text unique,          -- Stripe Connect Express (Chunk 4)
  payouts_enabled boolean not null default false,
  onboarded_at timestamptz,               -- finished the 3-question questionnaire
  created_at timestamptz not null default now()
);

-- Private seller details: never exposed to other users.
create table seller_addresses (
  user_id uuid primary key references profiles (id) on delete cascade,
  name text not null,
  line1 text not null,
  line2 text,
  city text not null,
  state text not null,
  zip text not null check (zip ~ '^\d{5}$'),
  updated_at timestamptz not null default now()
);

-- Listings and photos -------------------------------------------------------

create table listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references profiles (id) on delete cascade,
  title text not null check (char_length(title) between 5 and 80),
  brand text,
  category listing_category not null,
  subcategory text,
  condition listing_condition not null,
  flaws text not null check (char_length(flaws) >= 3),
  description text not null default '',
  price_cents integer not null check (price_cents >= 500),
  package_size package_size not null,
  status listing_status not null default 'active',
  reserved_until timestamptz,             -- held while a checkout is open
  banned_items_ack boolean not null check (banned_items_ack),
  search tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(brand, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_browse_idx on listings (status, category, created_at desc);
create index listings_price_idx on listings (status, price_cents);
create index listings_search_idx on listings using gin (search);
create index listings_title_trgm_idx on listings using gin (title gin_trgm_ops);
create index listings_seller_idx on listings (seller_id);

create table listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings (id) on delete cascade,
  storage_path text not null,             -- bucket: listing-photos
  alt text not null default '',
  position smallint not null default 0,
  width integer,
  height integer
);

create index listing_photos_listing_idx on listing_photos (listing_id, position);

-- Orders, payouts and messages ----------------------------------------------

create sequence order_number_seq start 10000;

create table orders (
  id uuid primary key default gen_random_uuid(),
  number text not null unique default ('OSC-' || nextval('order_number_seq')),
  listing_id uuid not null references listings (id),
  buyer_id uuid not null references profiles (id),
  seller_id uuid not null references profiles (id),
  status order_status not null default 'pending_payment',

  item_cents integer not null,
  shipping_cents integer not null,
  commission_rate numeric(5, 4) not null, -- copied from settings at payment time
  commission_cents integer not null,
  seller_share_cents integer generated always as (item_cents - commission_cents) stored,

  ship_to jsonb not null,                 -- buyer address, shared only with Shippo
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text unique,
  stripe_charge_id text,

  shippo_rate_id text,
  shippo_transaction_id text unique,
  label_url text,
  qr_code_url text,
  tracking_number text,
  tracking_status text,

  paid_at timestamptz,
  ship_by timestamptz,                    -- paid_at + 5 days (decision 7)
  reminder_sent_at timestamptz,
  label_ready_at timestamptz,
  shipped_at timestamptz,                 -- first USPS acceptance scan
  delivered_at timestamptz,
  cancelled_at timestamptz,
  refunded_at timestamptz,
  created_at timestamptz not null default now()
);

create index orders_buyer_idx on orders (buyer_id, created_at desc);
create index orders_seller_idx on orders (seller_id, created_at desc);
create index orders_status_ship_by_idx on orders (status, ship_by);
-- At most one live order per listing, so two buyers can never buy the same item.
create unique index orders_one_live_per_listing on orders (listing_id)
  where status not in ('cancelled', 'refunded');

create table payouts (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references orders (id), -- unique: the transfer fires once
  seller_id uuid not null references profiles (id),
  amount_cents integer not null,
  status payout_status not null default 'held',
  stripe_transfer_id text unique,
  transferred_at timestamptz,
  created_at timestamptz not null default now()
);

create table order_messages (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders (id) on delete cascade,
  author_id uuid not null references profiles (id),
  body text not null check (char_length(body) between 1 and 4000),
  photo_paths text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index order_messages_order_idx on order_messages (order_id, created_at);

-- Reports and settings ------------------------------------------------------

create table reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references profiles (id),
  listing_id uuid references listings (id) on delete cascade,
  reason text not null,
  details text,
  status report_status not null default 'open',
  resolved_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

create table settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

insert into settings (key, value) values
  ('commission_rate', '0.10'),            -- decision 5 placeholder
  ('ship_by_days', '5'),
  ('ship_reminder_day', '3');

-- Helpers -------------------------------------------------------------------

create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin');
$$;

-- New auth user → empty profile row.
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Row level security --------------------------------------------------------

alter table profiles enable row level security;
alter table seller_addresses enable row level security;
alter table listings enable row level security;
alter table listing_photos enable row level security;
alter table orders enable row level security;
alter table payouts enable row level security;
alter table order_messages enable row level security;
alter table reports enable row level security;
alter table settings enable row level security;

-- Public profile fields are readable by anyone; role and Stripe columns are
-- filtered out in the public view below.
create policy "profiles: owner or admin reads" on profiles for select
  using (id = auth.uid() or is_admin());
create policy "profiles: owner updates" on profiles for update
  using (id = auth.uid()) with check (id = auth.uid());
-- Users may edit their own profile fields, but never their role, suspension
-- or Stripe status; only the server sets those.
revoke update on profiles from authenticated;
grant update (display_name, city, state, intent, activities, onboarded_at) on profiles to authenticated;

create view public_profiles with (security_invoker = false) as
  select id, display_name, city, state from profiles where suspended_at is null;

create policy "addresses: owner only" on seller_addresses for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "listings: public reads active" on listings for select
  using (status in ('active', 'reserved', 'sold') or seller_id = auth.uid() or is_admin());
create policy "listings: seller inserts" on listings for insert
  with check (seller_id = auth.uid());
create policy "listings: seller edits own unsold" on listings for update
  using (seller_id = auth.uid() and status in ('active', 'paused'))
  with check (seller_id = auth.uid() and status in ('active', 'paused'));
create policy "listings: seller deletes own unsold" on listings for delete
  using (seller_id = auth.uid() and status in ('active', 'paused'));

create policy "photos: readable with listing" on listing_photos for select
  using (exists (select 1 from listings l where l.id = listing_id));
create policy "photos: seller manages" on listing_photos for all
  using (exists (select 1 from listings l where l.id = listing_id and l.seller_id = auth.uid()))
  with check (exists (select 1 from listings l where l.id = listing_id and l.seller_id = auth.uid()));

-- Orders and payouts are written only by the server (service role).
create policy "orders: parties read" on orders for select
  using (buyer_id = auth.uid() or seller_id = auth.uid() or is_admin());
create policy "payouts: seller reads" on payouts for select
  using (seller_id = auth.uid() or is_admin());

create policy "messages: parties read" on order_messages for select
  using (exists (
    select 1 from orders o where o.id = order_id
      and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
  ) or is_admin());
create policy "messages: parties write" on order_messages for insert
  with check (author_id = auth.uid() and (exists (
    select 1 from orders o where o.id = order_id
      and (o.buyer_id = auth.uid() or o.seller_id = auth.uid())
  ) or is_admin()));

create policy "reports: signed-in users file" on reports for insert
  with check (reporter_id = auth.uid());
create policy "reports: admin reads" on reports for select using (is_admin());

create policy "settings: public reads" on settings for select using (true);
