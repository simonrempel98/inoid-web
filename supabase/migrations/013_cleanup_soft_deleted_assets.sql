-- ============================================================
-- INOid.app – Cleanup soft-deleted assets
-- Migration: 013_cleanup_soft_deleted_assets.sql
--
-- Alle Assets mit deleted_at IS NOT NULL werden hard-deleted.
-- ON DELETE CASCADE entfernt automatisch:
--   - maintenance_schedules
--   - asset_lifecycle_events
--   - asset_documents
--   - service_entries
--   - asset_tags
-- ============================================================

DELETE FROM assets WHERE deleted_at IS NOT NULL;
