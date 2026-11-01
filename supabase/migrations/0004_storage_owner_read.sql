-- Storage only lets a user list or remove files they can also read through
-- row level security. Without this, deleting a listing (and cleaning up after
-- a failed publish) left the seller's photo files behind. Sellers can read
-- only their own folder; everyone else still sees photos through the public URL.

create policy "listing photos: sellers read their own" on storage.objects
  for select to authenticated
  using (bucket_id = 'listing-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
