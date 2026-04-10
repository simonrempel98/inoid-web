-- Migration 027: Mehrere Assets pro Vorlagen-Zelle (slot × druckwerk)

create table if not exists flexo_template_cell_assets (
  id           uuid default gen_random_uuid() primary key,
  template_id  uuid not null references flexo_templates(id) on delete cascade,
  slot_id      uuid not null references flexo_template_slots(id) on delete cascade,
  druckwerk_id uuid not null references flexo_druckwerke(id) on delete cascade,
  asset_id     uuid not null references assets(id) on delete cascade,
  sort_order   smallint not null default 0,
  org_id       uuid not null references organizations(id) on delete cascade,
  created_at   timestamptz default now(),
  unique(slot_id, druckwerk_id, asset_id)
);

alter table flexo_template_cell_assets enable row level security;

create policy "select_own_org" on flexo_template_cell_assets
  for select using (org_id in (select organization_id from profiles where id = auth.uid()));

create policy "insert_own_org" on flexo_template_cell_assets
  for insert with check (org_id in (select organization_id from profiles where id = auth.uid()));

create policy "delete_own_org" on flexo_template_cell_assets
  for delete using (org_id in (select organization_id from profiles where id = auth.uid()));

-- Bestehende Einzelzuweisungen migrieren
insert into flexo_template_cell_assets (template_id, slot_id, druckwerk_id, asset_id, org_id)
select template_id, slot_id, druckwerk_id, asset_id, org_id
from flexo_template_assignments
where asset_id is not null
on conflict (slot_id, druckwerk_id, asset_id) do nothing;
