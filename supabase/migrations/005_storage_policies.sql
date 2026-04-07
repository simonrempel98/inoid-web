-- ============================================================
-- INOid.app – Storage Policies für org-files Bucket
-- Migration: 005_storage_policies.sql
--
-- WICHTIG: Erst den Bucket "org-files" in Supabase Storage
-- als Public Bucket anlegen, dann dieses SQL ausführen.
-- ============================================================

-- Eingeloggte Nutzer dürfen Dateien hochladen
CREATE POLICY "org-files: authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'org-files');

-- Jeder darf Dateien lesen (public bucket)
CREATE POLICY "org-files: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'org-files');

-- Eingeloggte Nutzer dürfen eigene Dateien ersetzen (upsert)
CREATE POLICY "org-files: authenticated update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'org-files');

-- Eingeloggte Nutzer dürfen Dateien löschen
CREATE POLICY "org-files: authenticated delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'org-files');
