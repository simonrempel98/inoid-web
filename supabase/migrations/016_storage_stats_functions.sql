-- ============================================================
-- INOid.app – Storage Stats Functions (Admin)
-- Migration: 016_storage_stats_functions.sql
-- ============================================================

-- Funktion 1: Speicher pro Organisation (Bilder + Dokumente gezählt)
CREATE OR REPLACE FUNCTION admin_get_org_storage_stats()
RETURNS TABLE (
  organization_id uuid,
  organization_name text,
  image_count bigint,
  document_count bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    o.id            AS organization_id,
    o.name          AS organization_name,
    COALESCE(
      (SELECT SUM(array_length(a2.image_urls, 1))
       FROM assets a2
       WHERE a2.organization_id = o.id
         AND a2.deleted_at IS NULL
         AND array_length(a2.image_urls, 1) > 0),
      0
    )::bigint       AS image_count,
    COALESCE(
      (SELECT COUNT(*) FROM asset_documents ad
       JOIN assets a3 ON ad.asset_id = a3.id
       WHERE a3.organization_id = o.id),
      0
    )::bigint       AS document_count
  FROM organizations o
  ORDER BY o.name;
$$;

-- Funktion 2: Gesamt-Speicherverbrauch pro Bucket (aus storage.objects)
CREATE OR REPLACE FUNCTION admin_get_bucket_stats()
RETURNS TABLE (
  bucket_id   text,
  file_count  bigint,
  total_bytes bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = storage
AS $$
  SELECT
    bucket_id,
    COUNT(*)::bigint                                          AS file_count,
    SUM(COALESCE((metadata->>'size')::bigint, 0))::bigint    AS total_bytes
  FROM storage.objects
  GROUP BY bucket_id
  ORDER BY total_bytes DESC;
$$;
