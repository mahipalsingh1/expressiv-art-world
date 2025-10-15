-- Update artworks table to auto-approve by default
ALTER TABLE public.artworks ALTER COLUMN status SET DEFAULT 'approved'::artwork_status;