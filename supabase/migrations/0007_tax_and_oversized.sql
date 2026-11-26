-- JD's Nov 26 decisions:
-- 1. An Oversized package size for gear bigger than 18 x 14 x 10 in.
-- 2. Texas sales tax (8.25%) on orders shipped to Texas, recorded per order so
--    the admin page can total it for filing. Buyers can read it on their order.

alter type package_size add value if not exists 'oversized';

alter table orders add column if not exists tax_cents integer not null default 0
  check (tax_cents >= 0);

grant select (tax_cents) on orders to authenticated;
