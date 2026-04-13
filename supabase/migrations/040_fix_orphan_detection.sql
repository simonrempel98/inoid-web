-- ============================================================
-- INOid.app – Fix: Orphan-Erkennung erkennt Legacy-Pfade nicht
-- Migration: 040_fix_orphan_detection.sql
--
-- Problem: asset-edit-form.tsx hat Bilder ohne assets/-Präfix
-- hochgeladen: {uuid}/{timestamp}-{random}.jpg
-- Diese wurden fälschlicherweise als "verwaist" markiert.
--
-- Lösung: RPC erkennt auch Legacy-Pfad-Format {uuid}/...
-- und prüft ob der erste Pfadsegment ein gültiger Asset-UUID ist.
-- ============================================================

DROP FUNCTION IF EXISTS admin_get_unattributed_storage();

CREATE FUNCTION admin_get_unattributed_storage()
RETURNS TABLE (
  bucket_id  text,
  file_path  text,
  bytes      bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, storage
AS $$
  SELECT
    so.bucket_id,
    so.name AS file_path,
    COALESCE((so.metadata->>'size')::bigint, 0) AS bytes
  FROM storage.objects so
  WHERE NOT (
    -- Bekanntes Muster assets/{uuid}/... mit existierendem Asset
    (
      so.name LIKE 'assets/%'
      AND EXISTS (
        SELECT 1 FROM assets a WHERE a.id::text = split_part(so.name, '/', 2)
      )
    )
    OR
    -- Bekanntes Muster service/{uuid}/... mit existierendem Asset
    (
      so.name LIKE 'service/%'
      AND EXISTS (
        SELECT 1 FROM assets a WHERE a.id::text = split_part(so.name, '/', 2)
      )
    )
    OR
    -- Bekanntes Muster areas/{uuid}/... mit existierender Area
    (
      so.name LIKE 'areas/%'
      AND EXISTS (
        SELECT 1 FROM areas ar WHERE ar.id::text = split_part(so.name, '/', 2)
      )
    )
    OR
    -- Legacy-Format: {uuid}/... (ohne Präfix, erster Segment = Asset-UUID)
    -- Kommt vor wenn asset-edit-form ohne assets/-Präfix hochgeladen hat
    (
      so.name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/'
      AND EXISTS (
        SELECT 1 FROM assets a WHERE a.id::text = split_part(so.name, '/', 1)
      )
    )
  )
  ORDER BY bytes DESC;
$$;
