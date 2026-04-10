-- Nachrichten können bearbeitet werden
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- Realtime auch für UPDATE-Events aktivieren
ALTER PUBLICATION supabase_realtime DROP TABLE chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
