-- ── 039_sensor_data.sql ─────────────────────────────────────────────────────
-- Sensor-Definitionen und Zeitreihendaten pro Asset

-- Sensoren pro Asset
create table if not exists sensors (
  id              uuid primary key default gen_random_uuid(),
  asset_id        uuid references assets(id) on delete cascade not null,
  organization_id uuid references organizations(id) on delete cascade not null,
  name            text not null,
  type            text not null default 'generic',
  unit            text not null default '',
  config          jsonb default '{}',
  is_active       boolean default true,
  created_at      timestamptz default now()
);

-- Zeitreihendaten
create table if not exists sensor_readings (
  id          bigserial primary key,
  sensor_id   uuid references sensors(id) on delete cascade not null,
  value       numeric not null,
  quality     smallint default 100,
  recorded_at timestamptz not null default now()
);

-- Performance-Index für schnelle Zeitreihen-Abfragen
create index if not exists idx_sensor_readings_sensor_time
  on sensor_readings(sensor_id, recorded_at desc);

-- API-Key für Sensor-Ingest (einmal pro Organisation)
alter table organizations
  add column if not exists sensor_api_key text unique default gen_random_uuid()::text;

-- ── RLS ─────────────────────────────────────────────────────────────────────

alter table sensors enable row level security;
alter table sensor_readings enable row level security;

-- Sensoren: nur eigene Org
create policy "sensors_select" on sensors for select
  using (organization_id = (
    select organization_id from profiles where id = auth.uid()
  ));

create policy "sensors_insert" on sensors for insert
  with check (organization_id = (
    select organization_id from profiles where id = auth.uid()
  ));

create policy "sensors_update" on sensors for update
  using (organization_id = (
    select organization_id from profiles where id = auth.uid()
  ));

create policy "sensors_delete" on sensors for delete
  using (organization_id = (
    select organization_id from profiles where id = auth.uid()
  ));

-- Readings: nur Sensoren der eigenen Org
create policy "readings_select" on sensor_readings for select
  using (
    sensor_id in (
      select id from sensors
      where organization_id = (
        select organization_id from profiles where id = auth.uid()
      )
    )
  );

-- ── Realtime aktivieren ──────────────────────────────────────────────────────
alter publication supabase_realtime add table sensor_readings;
