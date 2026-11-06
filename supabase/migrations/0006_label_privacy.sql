-- Chunk 5: USPS labels. A label and its Post Office QR code print the seller's
-- full address, and buyers can read their own order rows, so those columns
-- (and the Stripe and Shippo ids) are readable only by the server's service
-- role. The site fetches the label for the seller with the admin client.

revoke select on orders from anon, authenticated;

grant select (
  id, number, listing_id, buyer_id, seller_id, status,
  item_cents, shipping_cents, commission_rate, commission_cents, seller_share_cents,
  ship_to, tracking_number, tracking_status,
  paid_at, ship_by, reminder_sent_at, label_ready_at, shipped_at, delivered_at,
  cancelled_at, refunded_at, created_at
) on orders to authenticated;

-- Shipped orders are looked up by tracking number when USPS updates arrive.
create index if not exists orders_tracking_number_idx on orders (tracking_number);
