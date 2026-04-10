-- 025_flexodruck_v2.sql
-- Maschinen-Bild, Slot-Umbenennung (Trägerstange → Druckbild/Farbe)

-- 1. Maschinen-Profilbild
ALTER TABLE flexo_machines
  ADD COLUMN IF NOT EXISTS image_url text;

-- 2. Bestehende Slot-Namen umbenennen
UPDATE flexo_fixed_slots SET label = 'Druckbild' WHERE label = 'Trägerstange 1' AND sort_order = 0;
UPDATE flexo_fixed_slots SET label = 'Farbe'     WHERE label = 'Trägerstange 2' AND sort_order = 1;

-- 3. Storage: machine-images Bucket (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('machine-images', 'machine-images', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "machine_images_public_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'machine-images');

CREATE POLICY "machine_images_auth_upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'machine-images' AND auth.role() = 'authenticated');

CREATE POLICY "machine_images_auth_delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'machine-images' AND auth.role() = 'authenticated');
