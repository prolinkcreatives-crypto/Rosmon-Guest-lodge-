-- Diagnostic finding (admin gallery upload):
-- Migration 20260828073003 created RLS policies on storage.objects scoped
-- to bucket_id = 'gallery' (staff SELECT, manager/admin INSERT/UPDATE/DELETE),
-- but no migration ever created the 'gallery' bucket itself in
-- storage.buckets. Every upload therefore fails at the Storage API layer
-- ("Bucket not found") before RLS is even evaluated, regardless of the
-- caller's role.
--
-- Created private (public = false): the admin panel never renders a public
-- URL for these objects, it calls storage.from('gallery').createSignedUrl()
-- (see src/lib/admin/queries.ts, signedGalleryUrl), which matches a private
-- bucket. This does not relax any RLS policy — the existing policies from
-- 20260828073003 remain the only way to read/write objects in it.
--
-- Idempotent: safe to run even if the bucket was since created manually via
-- the Supabase dashboard.
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', false)
ON CONFLICT (id) DO NOTHING;
