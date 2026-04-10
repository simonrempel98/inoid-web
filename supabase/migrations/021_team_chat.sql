-- ============================================================
-- INOid.app – Team-Chat
-- Migration: 021_team_chat.sql
-- ============================================================

CREATE TABLE chat_messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  sender_name     text        NOT NULL,   -- denormalisiert für Realtime-Events
  sender_role     text,                   -- denormalisiert für Rollenbadge
  content         text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  asset_mentions  uuid[]      NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX chat_messages_org_time ON chat_messages (organization_id, created_at DESC);

-- Realtime aktivieren
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

-- RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Lesen: alle Mitglieder der gleichen Org
CREATE POLICY "chat_select" ON chat_messages
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Schreiben: eigene Org, eigene user_id
CREATE POLICY "chat_insert" ON chat_messages
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Löschen: eigene Nachrichten oder Admin/Superadmin
CREATE POLICY "chat_delete" ON chat_messages
  FOR DELETE USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND organization_id = chat_messages.organization_id
        AND app_role IN ('admin', 'superadmin')
    )
  );

-- ── Cleanup-Funktion: Nachrichten älter als 30 Tage löschen ─────────────────

CREATE OR REPLACE FUNCTION cleanup_old_chat_messages()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '30 days';
$$;

-- pg_cron falls verfügbar (täglicher Job um 03:00 UTC)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'inoid-cleanup-chat',
      '0 3 * * *',
      'SELECT cleanup_old_chat_messages()'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron nicht verfügbar – Cleanup erfolgt lazy beim Abrufen
  NULL;
END $$;
