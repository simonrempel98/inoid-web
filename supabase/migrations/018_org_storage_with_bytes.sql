-- ============================================================
-- INOid.app – Storage Stats mit Bytes pro Organisation
-- Migration: 018_org_storage_with_bytes.sql
-- Ersetzt admin_get_org_storage_stats() aus Migration 016
-- ============================================================

-- Return-Typ hat sich geändert (+ storage_bytes), daher DROP nötig
DROP FUNCTION IF EXISTS admin_get_org_storage_stats();

CREATE FUNCTION admin_get_org_storage_stats()
RETURNS TABLE (
  organization_id   uuid,
  organization_name text,
  org_slug          text,
  image_count       bigint,
  document_count    bigint,
  storage_bytes     bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, storage
AS $$
  WITH asset_storage AS (
    -- Alle Dateien in Storage, die einem Asset zugeordnet werden können
    -- Pfade: assets/{assetId}/... und asset-docs/{assetId}/...
    SELECT
      a.organization_id,
      SUM(COALESCE((so.metadata->>'size')::bigint, 0)) AS bytes
    FROM storage.objects so
    JOIN assets a ON (
      so.name LIKE 'assets/' || a.id::text || '/%'
      OR so.name LIKE 'asset-docs/' || a.id::text || '/%'
    )
    GROUP BY a.organization_id
  )
  SELECT
    o.id                          AS organization_id,
    o.name                        AS organization_name,
    o.slug                        AS org_slug,
    -- Bilder: Summe der image_urls Array-Längen pro Org
    COALESCE(
      (SELECT SUM(array_length(a2.image_urls, 1))
       FROM assets a2
       WHERE a2.organization_id = o.id
         AND a2.deleted_at IS NULL
         AND array_length(a2.image_urls, 1) > 0),
      0
    )::bigint                     AS image_count,
    -- Dokumente: Anzahl asset_documents Einträge
    COALESCE(
      (SELECT COUNT(*) FROM asset_documents ad
       JOIN assets a3 ON ad.asset_id = a3.id
       WHERE a3.organization_id = o.id),
      0
    )::bigint                     AS document_count,
    -- Speicher in Bytes aus storage.objects
    COALESCE(s.bytes, 0)::bigint  AS storage_bytes
  FROM organizations o
  LEFT JOIN asset_storage s ON s.organization_id = o.id
  ORDER BY storage_bytes DESC, o.name;
$$;
