-- USPS refuses a label without the seller's email and phone number, found in
-- the Shippo test. The phone is private: it goes on the label data only, and
-- buyers never see it. Nullable so existing address rows stay valid; the Sell
-- flow asks for it before a seller's next listing.

alter table seller_addresses
  add column phone text check (phone ~ '^\d{10}$');
