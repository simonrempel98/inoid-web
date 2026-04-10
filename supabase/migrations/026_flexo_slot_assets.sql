-- Migration 026: Mehrere Assets pro Trägerstange (Junction-Tabelle)

create table if not exists flexo_slot_assets (
  id         uuid default gen_random_uuid() primary key,
  slot_id    uuid not null references flexo_fixed_slots(id) on delete cascade,
  asset_id   uuid not null references assets(id) on delete cascade,
  sort_order smallint not null default 0,
  org_id     uuid not null references organizations(id) on delete cascade,
  created_at timestamptz default now(),
  unique(slot_id, asset_id)
);

alter table flexo_slot_assets enable row level security;

create policy "select_own_org" on flexo_slot_assets
  for select using (
    org_id in (select organization_id from profiles where id = auth.uid())
  );

create policy "insert_own_org" on flexo_slot_assets
  for insert with check (
    org_id in (select organization_id from profiles where id = auth.uid())
  );

create policy "delete_own_org" on flexo_slot_assets
  for delete using (
    org_id in (select organization_id from profiles where id = auth.uid())
  );

-- Bestehende Einzelverknüpfungen migrieren
insert into flexo_slot_assets (slot_id, asset_id, org_id, sort_order)
select id, asset_id, org_id, 0
from flexo_fixed_slots
where asset_id is not null
on conflict (slot_id, asset_id) do nothing;
