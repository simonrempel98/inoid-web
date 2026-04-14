-- ============================================================
-- INOid.app – Chat-Nachrichten reparieren
-- Migration: 041_fix_chat_messages.sql
--
-- Behebt:
-- 1. app_role-Spalte fehlt in profiles (wurde in 014 referenziert
--    aber nie mit ADD COLUMN angelegt)
-- 2. chat_messages-Tabelle ggf. nicht erstellt (021 scheiterte
--    an fehlender app_role-Spalte in der DELETE-Policy)
-- 3. Fehlende UPDATE-Policy für Nachrichten-Bearbeitung
-- ============================================================

-- 1. app_role sicher zur profiles-Tabelle hinzufügen
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS app_role text
    CHECK (app_role IN ('superadmin', 'admin', 'techniker', 'leser'));

-- 2. chat_messages-Tabelle erstellen (idempotent)
CREATE TABLE IF NOT EXISTS chat_messages (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid        NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  team_id         uuid        NOT NULL REFERENCES teams(id)         ON DELETE CASCADE,
  user_id         uuid        NOT NULL REFERENCES auth.users(id)    ON DELETE CASCADE,
  sender_name     text        NOT NULL,
  sender_role     text,
  content         text        NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  asset_mentions  uuid[]      NOT NULL DEFAULT '{}',
  edited_at       timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chat_messages_team_time ON chat_messages (team_id, created_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_org_time  ON chat_messages (organization_id, created_at DESC);

-- 3. edited_at nachrüsten falls Tabelle schon existierte ohne die Spalte
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- 4. Realtime aktivieren (wirft keinen Fehler wenn bereits registriert)
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. RLS aktivieren
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- 6. Alle Policies neu anlegen (sauber DROP + CREATE)
DROP POLICY IF EXISTS "chat_select" ON chat_messages;
DROP POLICY IF EXISTS "chat_insert" ON chat_messages;
DROP POLICY IF EXISTS "chat_update" ON chat_messages;
DROP POLICY IF EXISTS "chat_delete" ON chat_messages;

CREATE POLICY "chat_select" ON chat_messages
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "chat_insert" ON chat_messages
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- UPDATE: nur eigene Nachrichten
CREATE POLICY "chat_update" ON chat_messages
  FOR UPDATE USING (
    user_id = auth.uid()
  ) WITH CHECK (
    user_id = auth.uid()
  );

-- DELETE: eigene Nachrichten oder Admins der Org
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

-- 7. Cleanup-Funktion
CREATE OR REPLACE FUNCTION cleanup_old_chat_messages()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public
AS $$
  DELETE FROM chat_messages WHERE created_at < NOW() - INTERVAL '30 days';
$$;
