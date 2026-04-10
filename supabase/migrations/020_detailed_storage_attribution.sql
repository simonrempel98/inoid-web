-- ============================================================
-- INOid.app – Detaillierte Storage-Zuordnung pro Organisation
-- Migration: 020_detailed_storage_attribution.sql
--
-- Behebt: Dateien in service-files und areas/ in org-files
-- wurden bisher keiner Organisation zugeordnet.
--
-- Pfadmuster die erkannt werden:
--   assets/{assetId}/images/...  → asset-images  → über assets.organization_id
--   assets/{assetId}/docs/...    → org-files      → über assets.organization_id
--   service/{assetId}/{svcId}/…  → asset-images   → über assets.organization_id
--   service/{assetId}/{svcId}/…  → service-files  → über assets.organization_id
--   areas/{areaId}/…             → org-files      → über areas.organization_id
-- ============================================================

DROP FUNCTION IF EXISTS admin_get_org_storage_stats();
DROP FUNCTION IF EXISTS admin_get_unattributed_storage();

-- ── 1. Detaillierte Speicher-Stats pro Organisation ─────────────────────────

CREATE FUNCTION admin_get_org_storage_stats()
RETURNS TABLE (
  organization_id      uuid,
  organization_name    text,
  org_slug             text,
  -- Zähler (aus DB-Spalten, nicht Storage-Pfaden)
  image_count          bigint,
  document_count       bigint,
  service_entry_count  bigint,
  -- Bytes aufgeschlüsselt nach Dateityp (aus storage.objects)
  asset_image_bytes    bigint,
  asset_doc_bytes      bigint,
  service_photo_bytes  bigint,
  service_doc_bytes    bigint,
  area_file_bytes      bigint,
  -- Gesamt
  storage_bytes        bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, storage
AS $$
  WITH tagged AS (
    -- Jede Datei bekommt einen Typ und ihre ID (assetId oder areaId)
    SELECT
      so.bucket_id,
      so.name,
      COALESCE((so.metadata->>'size')::bigint, 0) AS bytes,
      -- Typ erkennen
      CASE
        WHEN so.bucket_id = 'asset-images' AND so.name LIKE 'assets/%'  THEN 'asset_image'
        WHEN so.bucket_id = 'asset-images' AND so.name LIKE 'service/%' THEN 'service_photo'
        WHEN so.bucket_id = 'org-files'    AND so.name LIKE 'assets/%'  THEN 'asset_doc'
        WHEN so.bucket_id = 'org-files'    AND so.name LIKE 'areas/%'   THEN 'area_file'
        WHEN so.bucket_id = 'service-files'                             THEN 'service_doc'
        ELSE 'unattributed'
      END AS file_type,
      -- ID aus dem Pfad extrahieren (zweites Segment: assets/{id}/... oder service/{id}/... oder areas/{id}/...)
      CASE
        WHEN so.name LIKE 'assets/%'  THEN split_part(so.name, '/', 2)
        WHEN so.name LIKE 'service/%' THEN split_part(so.name, '/', 2)
        WHEN so.name LIKE 'areas/%'   THEN split_part(so.name, '/', 2)
        ELSE NULL
      END AS entity_id_str,
      -- Welche Tabelle für den JOIN?
      CASE
        WHEN so.name LIKE 'assets/%'  THEN 'asset'
        WHEN so.name LIKE 'service/%' THEN 'asset'
        WHEN so.name LIKE 'areas/%'   THEN 'area'
        ELSE NULL
      END AS entity_type
    FROM storage.objects so
  ),
  org_tagged AS (
    -- Organisation zuordnen
    SELECT
      COALESCE(a.organization_id, ar.organization_id) AS organization_id,
      t.file_type,
      t.bytes
    FROM tagged t
    LEFT JOIN assets a  ON t.entity_type = 'asset' AND a.id::text  = t.entity_id_str
    LEFT JOIN areas  ar ON t.entity_type = 'area'  AND ar.id::text = t.entity_id_str
    WHERE t.file_type <> 'unattributed'
  )
  SELECT
    o.id                          AS organization_id,
    o.name                        AS organization_name,
    o.slug                        AS org_slug,
    -- Zähler aus DB-Spalten (zuverlässiger als Pfad-Zählung)
    COALESCE(
      (SELECT SUM(array_length(a2.image_urls, 1))
       FROM assets a2
       WHERE a2.organization_id = o.id
         AND a2.deleted_at IS NULL
         AND array_length(a2.image_urls, 1) > 0),
      0
    )::bigint AS image_count,
    COALESCE(
      (SELECT SUM(array_length(a3.document_urls, 1))
       FROM assets a3
       WHERE a3.organization_id = o.id
         AND a3.deleted_at IS NULL
         AND array_length(a3.document_urls, 1) > 0),
      0
    )::bigint AS document_count,
    COALESCE(
      (SELECT COUNT(*)
       FROM asset_lifecycle_events ale
       JOIN assets a4 ON ale.asset_id = a4.id
       WHERE a4.organization_id = o.id),
      0
    )::bigint AS service_entry_count,
    -- Bytes aufgeschlüsselt
    COALESCE(SUM(ot.bytes) FILTER (WHERE ot.file_type = 'asset_image'),   0)::bigint AS asset_image_bytes,
    COALESCE(SUM(ot.bytes) FILTER (WHERE ot.file_type = 'asset_doc'),     0)::bigint AS asset_doc_bytes,
    COALESCE(SUM(ot.bytes) FILTER (WHERE ot.file_type = 'service_photo'), 0)::bigint AS service_photo_bytes,
    COALESCE(SUM(ot.bytes) FILTER (WHERE ot.file_type = 'service_doc'),   0)::bigint AS service_doc_bytes,
    COALESCE(SUM(ot.bytes) FILTER (WHERE ot.file_type = 'area_file'),     0)::bigint AS area_file_bytes,
    COALESCE(SUM(ot.bytes),                                                0)::bigint AS storage_bytes
  FROM organizations o
  LEFT JOIN org_tagged ot ON ot.organization_id = o.id
  GROUP BY o.id, o.name, o.slug
  ORDER BY storage_bytes DESC, o.name;
$$;

-- ── 2. Nicht zugeordnete Dateien (Pfad passt zu keiner bekannten Org) ────────

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
  WHERE
    -- Pfad passt zu keinem bekannten Muster
    (
      so.name NOT LIKE 'assets/%'
      AND so.name NOT LIKE 'service/%'
      AND so.name NOT LIKE 'areas/%'
    )
    OR
    -- Pfad passt zu einem Muster, aber die referenzierte Entität existiert nicht mehr
    (
      so.name LIKE 'assets/%'
      AND NOT EXISTS (
        SELECT 1 FROM assets a WHERE a.id::text = split_part(so.name, '/', 2)
      )
    )
    OR
    (
      so.name LIKE 'service/%'
      AND NOT EXISTS (
        SELECT 1 FROM assets a WHERE a.id::text = split_part(so.name, '/', 2)
      )
    )
    OR
    (
      so.name LIKE 'areas/%'
      AND NOT EXISTS (
        SELECT 1 FROM areas ar WHERE ar.id::text = split_part(so.name, '/', 2)
      )
    )
  ORDER BY bytes DESC;
$$;
