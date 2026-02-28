
-- Create storage bucket for user uploads if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('user-uploads', 'user-uploads', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow authenticated users to upload
CREATE POLICY "Users can upload images" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read access
CREATE POLICY "Public read access for uploads" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'user-uploads');

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete own uploads" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'user-uploads' AND (storage.foldername(name))[1] = auth.uid()::text);
