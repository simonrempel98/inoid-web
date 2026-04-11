-- Crawl-Job-Queue: Crawler läuft im Hintergrund unabhängig vom Browser
CREATE TABLE IF NOT EXISTS inoai_crawl_jobs (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  crawler_id    text        NOT NULL REFERENCES inoai_crawlers(id) ON DELETE CASCADE,
  status        text        NOT NULL DEFAULT 'queued',  -- queued | running | paused | done | error
  log           text[]      NOT NULL DEFAULT '{}',
  stats         jsonb       NOT NULL DEFAULT '{}',
  resume_state  jsonb,
  diff          jsonb,      -- { added: string[], removed: string[], before: string[] }
  created_at    timestamptz NOT NULL DEFAULT now(),
  started_at    timestamptz,
  finished_at   timestamptz
);

ALTER TABLE inoai_crawl_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages crawl jobs"
  ON inoai_crawl_jobs FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE INDEX inoai_crawl_jobs_crawler_status ON inoai_crawl_jobs (crawler_id, created_at DESC);
CREATE INDEX inoai_crawl_jobs_active ON inoai_crawl_jobs (status, created_at)
  WHERE status IN ('queued', 'running', 'paused');
