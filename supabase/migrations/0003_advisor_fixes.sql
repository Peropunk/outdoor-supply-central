-- Fixes from Supabase's database advisor after the first push. No data or
-- behaviour change: same access rules, checked faster and with less exposed.

-- The sign-up trigger function should not be callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Keep the search extension out of the API-exposed public schema. The title
-- search index keeps working.
alter extension pg_trgm set schema extensions;

-- Evaluate auth.uid() and is_admin() once per query instead of once per row,
-- by wrapping them in (select ...). Same rules as 0001.

drop policy "profiles: owner or admin reads" on profiles;
create policy "profiles: owner or admin reads" on profiles for select
  using (id = (select auth.uid()) or (select is_admin()));

drop policy "profiles: owner updates" on profiles;
create policy "profiles: owner updates" on profiles for update
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy "addresses: owner only" on seller_addresses;
create policy "addresses: owner only" on seller_addresses for all
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy "listings: public reads active" on listings;
create policy "listings: public reads active" on listings for select
  using (status in ('active', 'reserved', 'sold') or seller_id = (select auth.uid()) or (select is_admin()));

drop policy "listings: seller inserts" on listings;
create policy "listings: seller inserts" on listings for insert
  with check (seller_id = (select auth.uid()));

drop policy "listings: seller edits own unsold" on listings;
create policy "listings: seller edits own unsold" on listings for update
  using (seller_id = (select auth.uid()) and status in ('active', 'paused'))
  with check (seller_id = (select auth.uid()) and status in ('active', 'paused'));

drop policy "listings: seller deletes own unsold" on listings;
create policy "listings: seller deletes own unsold" on listings for delete
  using (seller_id = (select auth.uid()) and status in ('active', 'paused'));

-- One policy per action on photos: reading stays public with the listing,
-- writing is split out so it no longer overlaps the read rule.
drop policy "photos: seller manages" on listing_photos;
create policy "photos: seller adds" on listing_photos for insert
  with check (exists (select 1 from listings l where l.id = listing_id and l.seller_id = (select auth.uid())));
create policy "photos: seller edits" on listing_photos for update
  using (exists (select 1 from listings l where l.id = listing_id and l.seller_id = (select auth.uid())))
  with check (exists (select 1 from listings l where l.id = listing_id and l.seller_id = (select auth.uid())));
create policy "photos: seller deletes" on listing_photos for delete
  using (exists (select 1 from listings l where l.id = listing_id and l.seller_id = (select auth.uid())));

drop policy "orders: parties read" on orders;
create policy "orders: parties read" on orders for select
  using (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()) or (select is_admin()));

drop policy "payouts: seller reads" on payouts;
create policy "payouts: seller reads" on payouts for select
  using (seller_id = (select auth.uid()) or (select is_admin()));

drop policy "messages: parties read" on order_messages;
create policy "messages: parties read" on order_messages for select
  using (exists (
    select 1 from orders o where o.id = order_id
      and (o.buyer_id = (select auth.uid()) or o.seller_id = (select auth.uid()))
  ) or (select is_admin()));

drop policy "messages: parties write" on order_messages;
create policy "messages: parties write" on order_messages for insert
  with check (author_id = (select auth.uid()) and (exists (
    select 1 from orders o where o.id = order_id
      and (o.buyer_id = (select auth.uid()) or o.seller_id = (select auth.uid()))
  ) or (select is_admin())));

drop policy "reports: signed-in users file" on reports;
create policy "reports: signed-in users file" on reports for insert
  with check (reporter_id = (select auth.uid()));

drop policy "reports: admin reads" on reports;
create policy "reports: admin reads" on reports for select using ((select is_admin()));
