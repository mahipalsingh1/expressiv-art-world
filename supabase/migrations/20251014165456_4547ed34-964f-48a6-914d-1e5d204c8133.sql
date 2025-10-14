-- Create storage bucket for artworks
INSERT INTO storage.buckets (id, name, public) VALUES ('artworks', 'artworks', true);

-- Storage policies for artworks bucket
CREATE POLICY "Artwork images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'artworks');

CREATE POLICY "Authenticated users can upload artworks"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'artworks' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own artworks"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'artworks' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own artworks"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'artworks' AND auth.uid()::text = (storage.foldername(name))[1]);