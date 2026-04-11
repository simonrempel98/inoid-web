-- INOai Chat History
-- Speichert Chat-Sessions und Nachrichten pro Nutzer

CREATE TABLE inoai_chat_sessions (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     uuid        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id      uuid        REFERENCES organizations(id) ON DELETE CASCADE,
  title       text        NOT NULL DEFAULT 'Neues Gespräch',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE inoai_chat_messages (
  id          uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  uuid        REFERENCES inoai_chat_sessions(id) ON DELETE CASCADE NOT NULL,
  role        text        NOT NULL CHECK (role IN ('user', 'assistant')),
  content     text        NOT NULL,
  sources     jsonb,
  created_at  timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX ON inoai_chat_sessions (user_id, updated_at DESC);
CREATE INDEX ON inoai_chat_messages (session_id, created_at ASC);

-- RLS
ALTER TABLE inoai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE inoai_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users sehen eigene Sessions"
  ON inoai_chat_sessions FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users sehen Nachrichten ihrer Sessions"
  ON inoai_chat_messages FOR ALL
  USING (
    session_id IN (
      SELECT id FROM inoai_chat_sessions WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    session_id IN (
      SELECT id FROM inoai_chat_sessions WHERE user_id = auth.uid()
    )
  );
