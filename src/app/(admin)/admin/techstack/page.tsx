// Admin-only · kein i18n · nur Deutsch
export default function TechStackPage() {
  const S = {
    page: { fontFamily: "'Courier New', monospace", color: 'var(--adm-text5)', paddingBottom: 80 } as React.CSSProperties,
    h1: { fontSize: 28, fontWeight: 900, color: 'var(--adm-text)', margin: '0 0 6px', letterSpacing: '-0.02em' } as React.CSSProperties,
    h2: { fontSize: 11, fontWeight: 700, color: 'var(--adm-text4)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', margin: '0 0 14px' },
    h3: { fontSize: 14, fontWeight: 700, color: 'var(--adm-text)', margin: '0 0 10px' } as React.CSSProperties,
    card: { background: 'var(--adm-surface)', borderRadius: 14, border: '1px solid var(--adm-border)', padding: '20px', marginBottom: 16 } as React.CSSProperties,
    badge: (color: string, bg: string) => ({ display: 'inline-block', background: bg, color, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 5, marginRight: 6, marginBottom: 6, fontFamily: 'Arial, sans-serif' } as React.CSSProperties),
    tag: { display: 'inline-block', background: 'var(--adm-border)', color: 'var(--adm-text2)', fontSize: 11, padding: '2px 8px', borderRadius: 4, marginRight: 4, marginBottom: 4, fontFamily: 'Arial, sans-serif' } as React.CSSProperties,
    mono: { fontFamily: "'Courier New', monospace", fontSize: 12, color: '#34d399' } as React.CSSProperties,
    label: { fontSize: 11, color: 'var(--adm-text3)', display: 'block', marginBottom: 2, fontFamily: 'Arial, sans-serif' } as React.CSSProperties,
    val: { fontSize: 13, color: 'var(--adm-text5)', fontFamily: 'Arial, sans-serif' } as React.CSSProperties,
  }

  const grid2 = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 } as React.CSSProperties
  const grid3 = { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 32 } as React.CSSProperties
  const grid4 = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 } as React.CSSProperties

  const METHOD_COLORS: Record<string, { bg: string; color: string }> = {
    GET:    { bg: '#064e3b', color: '#34d399' },
    POST:   { bg: '#1e3a5f', color: '#60a5fa' },
    PATCH:  { bg: '#2a1f00', color: '#fbbf24' },
    PUT:    { bg: '#2d1b69', color: '#a78bfa' },
    DELETE: { bg: '#450a0a', color: '#f87171' },
  }

  function method(m: string) {
    const c = METHOD_COLORS[m] ?? { bg: 'var(--adm-border)', color: 'var(--adm-text2)' }
    return <span style={{ ...S.badge(c.color, c.bg), fontFamily: "'Courier New', monospace", fontSize: 10, letterSpacing: '0.05em' }}>{m}</span>
  }

  function endpoint(methods: string[], path: string, desc: string, body?: string, auth?: string) {
    return (
      <div style={{ borderBottom: '1px solid var(--adm-border)', padding: '12px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>{methods.map(m => <span key={m}>{method(m)}</span>)}</div>
          <span style={{ ...S.mono, alignSelf: 'center' }}>{path}</span>
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--adm-text2)', fontFamily: 'Arial, sans-serif' }}>{desc}</p>
        {body && <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--adm-text4)', fontFamily: 'Arial, sans-serif' }}>Body: <span style={{ color: 'var(--adm-text3)' }}>{body}</span></p>}
        {auth && <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--adm-border2)', fontFamily: 'Arial, sans-serif' }}>Auth: {auth}</p>}
      </div>
    )
  }

  function table(headers: string[], rows: (string | React.ReactNode)[][]) {
    const cols = headers.length
    const tmpl = headers.map(() => '1fr').join(' ')
    return (
      <div style={{ background: 'var(--adm-input-bg)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--adm-border)', marginBottom: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: tmpl, padding: '8px 16px', borderBottom: '1px solid var(--adm-border)', background: 'var(--adm-surface)' }}>
          {headers.map(h => <span key={h} style={{ fontSize: 10, fontWeight: 700, color: 'var(--adm-text4)', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'Arial, sans-serif' }}>{h}</span>)}
        </div>
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: tmpl, padding: '9px 16px', borderBottom: i < rows.length - 1 ? '1px solid var(--adm-border)' : 'none' }}>
            {row.map((cell, j) => (
              <span key={j} style={{ fontSize: 12, color: j === 0 ? 'var(--adm-text5)' : 'var(--adm-text2)', fontFamily: j === 0 ? "'Courier New', monospace" : 'Arial, sans-serif' }}>{cell}</span>
            ))}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={S.page}>
      {/* ── Hero ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 40, borderBottom: '1px solid var(--adm-border)', paddingBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ background: '#0099cc', width: 10, height: 10, borderRadius: '50%' }} />
          <span style={{ fontSize: 11, color: '#0099cc', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'Arial, sans-serif' }}>
            INOid.app · Technische Dokumentation
          </span>
        </div>
        <h1 style={S.h1}>Tech Stack & Architektur</h1>
        <p style={{ fontSize: 14, color: 'var(--adm-text3)', margin: '0 0 16px', fontFamily: 'Arial, sans-serif', lineHeight: 1.6 }}>
          Vollständige Projektdokumentation · Stand: April 2026 · Version 1.x · SaaS Asset-Management-Platform für INOMETA GmbH
        </p>
        <div>
          {[
            ['Next.js 16.2', '#003366', '#1e3a5f'],
            ['React 19', '#0e7490', '#0c3a4a'],
            ['TypeScript 5', '#1d4ed8', '#1e2d5e'],
            ['Supabase', '#166534', '#052e16'],
            ['Vercel', '#111827', '#374151'],
            ['next-intl 4', '#7c3aed', '#2d1b69'],
          ].map(([label, color, bg]) => (
            <span key={label} style={S.badge(color as string, bg as string)}>{label}</span>
          ))}
        </div>
      </div>

      {/* ── Architektur-Übersicht ──────────────────────────────────── */}
      <h2 style={S.h2}>Architektur</h2>
      <div style={{ ...S.card, marginBottom: 32, fontFamily: 'Arial, sans-serif' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          {[
            { title: 'Frontend', color: '#0099cc', items: ['Next.js App Router', 'React 19 Server Components', 'Client Components (use client)', 'next-intl i18n (28 Sprachen)', 'Inline Styles (kein Tailwind)', 'Lucide Icons', 'Canvas API (Bildkomprimierung)', 'QR-Code-Generierung (qrcode)', 'pdf-lib (PDF-Komprimierung)', 'Supabase Realtime (Team-Chat)'] },
            { title: 'Backend / API', color: '#a78bfa', items: ['Next.js Route Handlers', 'Supabase SSR Auth', 'Supabase Admin Client (Service Role)', 'Row Level Security (RLS)', 'PostgreSQL Functions (SECURITY DEFINER)', 'Resend (E-Mail)', 'Vercel Edge Runtime', 'Admin-PIN (SHA-256 Hash)'] },
            { title: 'Infrastruktur', color: '#34d399', items: ['Vercel (Deploy & Hosting)', 'Supabase (DB + Auth + Storage)', 'PostgreSQL 15 (Supabase managed)', 'Supabase Storage (3 Buckets)', 'Vercel Analytics', 'GitHub (CI/CD via main branch)', 'Sentry (Error Tracking)', 'Cloudflare Turnstile (Bot-Schutz)'] },
          ].map(section => (
            <div key={section.title}>
              <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: section.color }}>{section.title}</p>
              {section.items.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: '50%', background: section.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: 'var(--adm-text2)' }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Tech Stack ──────────────────────────────────────────────── */}
      <h2 style={S.h2}>Abhängigkeiten & Versionen</h2>
      <div style={grid2}>
        <div style={S.card}>
          <h3 style={S.h3}>Core Framework</h3>
          {table(
            ['Paket', 'Version', 'Zweck'],
            [
              ['next', '16.2.2', 'App Router, RSC, Route Handlers'],
              ['react', '19.2.4', 'UI-Framework'],
              ['react-dom', '19.2.4', 'DOM-Renderer'],
              ['typescript', '^5', 'Statische Typisierung'],
            ]
          )}
          <h3 style={{ ...S.h3, marginTop: 16 }}>Internationalisierung</h3>
          {table(
            ['Paket', 'Version', 'Zweck'],
            [
              ['next-intl', '^4.9.0', '28 Sprachen, Server + Client'],
            ]
          )}
        </div>
        <div style={S.card}>
          <h3 style={S.h3}>Supabase</h3>
          {table(
            ['Paket', 'Version', 'Zweck'],
            [
              ['@supabase/supabase-js', '^2.101.1', 'DB, Auth, Storage Client'],
              ['@supabase/ssr', '^0.10.0', 'Server-Side Auth für Next.js'],
            ]
          )}
          <h3 style={{ ...S.h3, marginTop: 16 }}>Utilities</h3>
          {table(
            ['Paket', 'Version', 'Zweck'],
            [
              ['lucide-react', '^1.7.0', 'Icon-Bibliothek'],
              ['qrcode', '^1.5.4', 'QR-Code-Generierung'],
              ['jsqr', '^1.4.0', 'QR-Code-Scan (Canvas)'],
              ['resend', '^6.10.0', 'Transaktionale E-Mails'],
              ['@sentry/nextjs', '^10.47.0', 'Error Monitoring'],
              ['pdf-lib', '^1.17.1', 'Client-seitige PDF-Komprimierung'],
            ]
          )}
        </div>
      </div>

      {/* ── Datenbankschema ──────────────────────────────────────────── */}
      <h2 style={S.h2}>Datenbankschema (PostgreSQL via Supabase)</h2>
      <div style={S.card}>
        <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--adm-text3)', fontFamily: 'Arial, sans-serif' }}>
          21 Migrations · PostgreSQL 15 · Row Level Security aktiviert · UUID als Primary Keys · Supabase Auth (auth.users) als Basis
        </p>
        <div style={grid2}>
          {[
            {
              table: 'organizations', color: '#0099cc',
              cols: ['id uuid PK', 'name text', 'slug text UNIQUE', 'plan text', 'asset_limit int', 'user_limit int', 'is_active bool', 'features jsonb', 'settings jsonb', 'contact_email text', 'notes text', 'created_at timestamptz'],
            },
            {
              table: 'profiles', color: '#a78bfa',
              cols: ['id uuid PK → auth.users', 'organization_id uuid FK', 'email text', 'full_name text', 'app_role text', 'is_platform_admin bool', 'is_active bool', 'must_change_password bool', 'last_seen_at timestamptz', 'admin_pin_hash text', 'admin_pin_set_at timestamptz'],
            },
            {
              table: 'assets', color: '#34d399',
              cols: ['id uuid PK', 'organization_id uuid FK', 'name text', 'category text', 'manufacturer text', 'article_number text', 'serial_number text', 'order_number text', 'status text', 'location text', 'location_ref text', 'description text', 'image_urls text[]', 'document_urls text[]', 'technical_data jsonb', 'commercial_data jsonb', 'qr_code text', 'nfc_uid text', 'created_by uuid FK', 'deleted_at timestamptz'],
            },
            {
              table: 'asset_lifecycle_events', color: '#fbbf24',
              cols: ['id uuid PK', 'asset_id uuid FK', 'organization_id uuid FK', 'event_type text', 'title text', 'description text', 'event_date date', 'performed_by text', 'external_company text', 'cost numeric', 'checklist jsonb', 'notes text', 'created_by uuid FK'],
            },
            {
              table: 'maintenance_schedules', color: '#f87171',
              cols: ['id uuid PK', 'asset_id uuid FK', 'organization_id uuid FK', 'name text', 'interval_days int', 'next_due date', 'last_done date', 'steps jsonb', 'is_active bool'],
            },
            {
              table: 'locations / halls / areas', color: '#38bdf8',
              cols: ['Standortstruktur: 3-stufige Hierarchie', 'locations → halls → areas', 'Jeweils: id, organization_id, name, address', 'areas.hall_id FK → halls', 'halls.location_id FK → locations'],
            },
            {
              table: 'teams', color: '#fb923c',
              cols: ['id uuid PK', 'organization_id uuid FK', 'name text', 'description text', 'icon text', 'created_by uuid FK'],
            },
            {
              table: 'chat_messages', color: '#0099cc',
              cols: ['id uuid PK', 'organization_id uuid FK', 'user_id uuid FK', 'sender_name text', 'sender_role text', 'content text (1–2000)', 'asset_mentions uuid[]', 'created_at timestamptz'],
            },
            {
              table: 'organization_members', color: '#818cf8',
              cols: ['id uuid PK', 'organization_id uuid FK', 'user_id uuid FK → auth.users', 'email text', 'role_id uuid FK → roles', 'created_at timestamptz'],
            },
            {
              table: 'invoices', color: '#4ade80',
              cols: ['id uuid PK', 'organization_id uuid FK', 'amount numeric', 'plan text', 'status text', 'invoice_number text', 'pdf_url text', 'code_hash text', 'activated_at timestamptz', 'created_at timestamptz'],
            },
            {
              table: 'admin_audit_log', color: '#94a3b8',
              cols: ['id uuid PK', 'admin_id uuid FK', 'action text', 'target_type text', 'target_id text', 'details jsonb', 'created_at timestamptz'],
            },
          ].map(t => (
            <div key={t.table} style={{ background: 'var(--adm-bg)', borderRadius: 10, border: `1px solid ${t.color}33`, padding: '14px' }}>
              <p style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: t.color, fontFamily: "'Courier New', monospace" }}>{t.table}</p>
              {t.cols.map(col => (
                <div key={col} style={{ fontSize: 11, color: 'var(--adm-text3)', fontFamily: "'Courier New', monospace", marginBottom: 2 }}>
                  <span style={{ color: 'var(--adm-text4)' }}>· </span>{col}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Migrationen ──────────────────────────────────────────────── */}
      <h2 style={{ ...S.h2, marginTop: 32 }}>Migrationen</h2>
      <div style={S.card}>
        {table(
          ['Migration', 'Beschreibung'],
          [
            ['001_initial_schema', 'Kernschema: organizations, profiles, assets, service_entries, roles, members, storage policies'],
            ['002_asset_templates', 'Asset-Vorlagen (templates) mit technischen & kommerziellen Feldern'],
            ['003_organisation_structure', 'Standortstruktur: locations, halls, areas mit FK-Kaskade'],
            ['004_organisation_details', 'organizations: asset_limit, user_limit, is_active, contact_email, notes'],
            ['005_storage_policies', 'RLS-Policies für org-files Bucket (upload/read/update/delete)'],
            ['006_teams_structure', 'Teams-Modul: teams, team_members Tabellen'],
            ['007_team_org_ref', 'teams.organization_id FK + Index'],
            ['008_member_names', 'organization_members: email-Spalte für Einladungsflow'],
            ['009_maintenance_schedules', 'Wartungsintervalle: maintenance_schedules mit steps JSONB'],
            ['010_invoices', 'Rechnungsmodul: invoices mit code_hash & activated_at'],
            ['011_checklist', 'service_entries: checklist JSONB-Spalte hinzugefügt'],
            ['012_admin_module', 'Admin: admin_audit_log, platform_admin_settings, is_platform_admin Flag'],
            ['013_cleanup_soft_deleted_assets', 'Cleanup-Funktion: cleanup_soft_deleted_assets() PostgreSQL-Funktion'],
            ['014_superadmin_role', 'profiles.app_role (superadmin/admin/techniker/leser), asset_lifecycle_events'],
            ['015_org_features', 'organizations.features JSONB (serviceheft, wartung Toggle)'],
            ['016_storage_stats_functions', 'admin_get_storage_bucket_stats() & admin_get_org_storage_stats() Funktionen'],
            ['017_admin_pin', 'profiles.admin_pin_hash + admin_pin_set_at für PIN-Schutz'],
            ['018_org_storage_with_bytes', 'admin_get_org_storage_stats() um storage_bytes erweitert (DROP + RECREATE)'],
            ['019_fix_document_count', 'document_count aus assets.document_urls[] statt asset_documents Tabelle'],
            ['020_detailed_storage_attribution', 'admin_get_org_storage_stats() detailliert: 5 Pfadmuster, pro Asset-Typ aufgeschlüsselt + admin_get_unattributed_storage()'],
            ['021_team_chat', 'chat_messages Tabelle, RLS, Realtime-Publication, pg_cron Cleanup-Job (30 Tage)'],
          ]
        )}
      </div>

      {/* ── PostgreSQL Functions ─────────────────────────────────────── */}
      <h2 style={{ ...S.h2, marginTop: 32 }}>PostgreSQL-Funktionen</h2>
      <div style={S.card}>
        {[
          {
            name: 'admin_get_storage_bucket_stats()',
            returns: 'TABLE (bucket_id text, file_count bigint, total_bytes bigint)',
            desc: 'Aggregiert Dateianzahl und Gesamtgröße aller storage.objects pro Bucket. SECURITY DEFINER.',
          },
          {
            name: 'admin_get_org_storage_stats()',
            returns: 'TABLE (organization_id uuid, organization_name text, org_slug text, image_count bigint, document_count bigint, storage_bytes bigint)',
            desc: 'Verknüpft storage.objects mit assets → organizations. Zählt Bilder aus image_urls[], Dokumente aus document_urls[]. SECURITY DEFINER.',
          },
          {
            name: 'cleanup_soft_deleted_assets()',
            returns: 'integer (Anzahl gelöschter Assets)',
            desc: 'Hard-Delete aller Assets mit deleted_at IS NOT NULL. Cascaded über asset_lifecycle_events, maintenance_schedules, service_entries.',
          },
          {
            name: 'admin_get_unattributed_storage()',
            returns: 'TABLE (bucket text, name text, full_path text, size bigint, created_at timestamptz)',
            desc: 'Findet Dateien in storage.objects ohne zugehöriges Asset oder Bereich in der DB (verwaiste Dateien). Für orphaned-storage-button.tsx.',
          },
          {
            name: 'cleanup_old_chat_messages()',
            returns: 'void',
            desc: 'Löscht alle chat_messages älter als 30 Tage. Wird via pg_cron täglich um 03:00 UTC ausgeführt.',
          },
        ].map(fn => (
          <div key={fn.name} style={{ borderBottom: '1px solid var(--adm-border)', padding: '12px 0' }}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#34d399', fontFamily: "'Courier New', monospace" }}>{fn.name}</p>
            <p style={{ margin: '0 0 4px', fontSize: 11, color: 'var(--adm-text4)', fontFamily: "'Courier New', monospace" }}>RETURNS {fn.returns}</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text2)', fontFamily: 'Arial, sans-serif' }}>{fn.desc}</p>
          </div>
        ))}
      </div>

      {/* ── API-Endpunkte ────────────────────────────────────────────── */}
      <h2 style={{ ...S.h2, marginTop: 32 }}>API-Endpunkte</h2>
      <div style={grid2}>
        <div>
          <div style={S.card}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#a78bfa' }}>Admin · Organisationen</p>
            <p style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--adm-text4)', fontFamily: 'Arial, sans-serif' }}>Auth: is_platform_admin</p>
            {endpoint(['POST'], '/api/admin/orgs', 'Organisation + ersten Admin-User anlegen', 'name, slug, plan, assetLimit, userLimit, email, fullName, tempPassword')}
            {endpoint(['PATCH'], '/api/admin/orgs/[id]', 'Org-Felder aktualisieren (partial update)', 'name?, plan?, assetLimit?, features?, settings?, ...')}
            {endpoint(['DELETE'], '/api/admin/orgs/[id]', 'Org + alle User + Storage-Dateien + Auth-Accounts löschen')}
            {endpoint(['POST'], '/api/admin/orgs/[id]/users', 'Neuen Nutzer zu Org hinzufügen', 'email, fullName, tempPassword, appRole')}
            {endpoint(['GET'], '/api/admin/orgs/[id]/assets/neu', 'Admin-Seite: Neues Asset für Org anlegen (Server Component)')}
          </div>
          <div style={S.card}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#f87171' }}>Admin · Storage</p>
            <p style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--adm-text4)', fontFamily: 'Arial, sans-serif' }}>Auth: is_platform_admin</p>
            {endpoint(['DELETE'], '/api/admin/storage/nuke', 'ALLE Dateien aus allen 3 Buckets löschen (global)')}
            {endpoint(['DELETE'], '/api/admin/storage/orgs/[orgId]', 'Alle Dateien einer Org löschen (asset-images, org-files, service-files)')}
            {endpoint(['DELETE'], '/api/admin/storage/orphaned', 'Verwaiste Dateien löschen – alle Dateien ohne matching Asset/Bereich in der DB')}
          </div>
          <div style={S.card}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#60a5fa' }}>Admin · Team & User</p>
            <p style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--adm-text4)', fontFamily: 'Arial, sans-serif' }}>Auth: is_platform_admin</p>
            {endpoint(['POST'], '/api/admin/team', 'Platform-Admin-Mitglied anlegen', 'email, fullName, tempPassword')}
            {endpoint(['DELETE'], '/api/admin/team/[id]', 'Platform-Admin-Mitglied entfernen')}
            {endpoint(['POST'], '/api/admin/users/[id]', 'User-Aktionen: Passwort-Reset, Sperren/Entsperren', 'action: reset_password | toggle_active | force_pw_change')}
            {endpoint(['POST'], '/api/admin/cleanup', 'Soft-deleted Assets hard-deleten (cleanup_soft_deleted_assets())')}
          </div>
          <div style={S.card}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#fbbf24' }}>Admin · PIN</p>
            <p style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--adm-text4)', fontFamily: 'Arial, sans-serif' }}>Auth: is_platform_admin</p>
            {endpoint(['POST'], '/api/admin/pin', 'Admin-PIN verifizieren', 'pin: string → prüft SHA-256-Hash in profiles')}
            {endpoint(['PUT'], '/api/admin/pin', 'Admin-PIN ändern', 'currentPin?, newPin (mind. 4-stellig)')}
          </div>
        </div>
        <div>
          <div style={S.card}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#34d399' }}>Assets</p>
            <p style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--adm-text4)', fontFamily: 'Arial, sans-serif' }}>Auth: eingeloggter Org-User (gleiche org)</p>
            {endpoint(['DELETE'], '/api/assets/[id]/delete', 'Asset hard-deleten + Bilder aus asset-images + Dokumente aus org-files entfernen')}
            {endpoint(['GET', 'POST'], '/api/chat/messages', 'Team-Chat: Nachrichten laden (GET) oder senden (POST). GET: lazy cleanup + letzte 200 Msgs. POST: Feature-Check, insert mit denormalisierten sender_name/sender_role.')}
          </div>
          <div style={S.card}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#fb923c' }}>Billing</p>
            <p style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--adm-text4)', fontFamily: 'Arial, sans-serif' }}>Auth: eingeloggter User (Admin/Superadmin)</p>
            {endpoint(['POST'], '/api/billing/create-invoice', 'Rechnung erstellen + PDF generieren + per Resend verschicken', 'plan, billingName, billingAddress, ...')}
            {endpoint(['POST'], '/api/billing/activate-code', 'Einmalcode (9 Stellen) einlösen → Plan upgraden', 'code: string → prüft HMAC-SHA256-Hash in invoices')}
          </div>
          <div style={S.card}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#9ca3af' }}>Auth-Callbacks (Next.js Middleware)</p>
            <p style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--adm-text4)', fontFamily: 'Arial, sans-serif' }}>Supabase Auth-Hooks</p>
            {endpoint(['GET'], '/auth/callback', 'Supabase OAuth/Magic-Link Callback → Session setzen')}
            {endpoint(['GET'], '/invite/[token]', 'Einladungslink → Token validieren + Registrierungsformular')}
          </div>
          <div style={S.card}>
            <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>Supabase Direkt-Calls (kein HTTP-Endpoint)</p>
            <p style={{ margin: '0 0 12px', fontSize: 11, color: 'var(--adm-text4)', fontFamily: 'Arial, sans-serif' }}>Client- oder Server-Side via Supabase SDK</p>
            {['assets (CRUD)', 'service_entries (CRUD)', 'maintenance_schedules (CRUD)', 'locations/halls/areas (CRUD)', 'teams/team_members (CRUD)', 'profiles (READ + UPDATE)', 'invoices (READ)', 'asset_templates (CRUD)'].map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 0', borderBottom: '1px solid var(--adm-surface2)' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#38bdf8', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--adm-text2)', fontFamily: 'Arial, sans-serif' }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Storage-Buckets ──────────────────────────────────────────── */}
      <h2 style={{ ...S.h2, marginTop: 16 }}>Storage-Buckets (Supabase)</h2>
      <div style={S.card}>
        {table(
          ['Bucket', 'Pfad-Schema', 'Inhalt', 'Public'],
          [
            ['asset-images', 'assets/{assetId}/images/{timestamp}.jpg', 'Asset-Fotos (Canvas-komprimiert, JPEG)', 'Ja (public read)'],
            ['org-files', 'assets/{assetId}/docs/{timestamp}_{name}', 'Asset-Dokumente (PDF, XLSX, DOCX, …)', 'Ja (public read)'],
            ['service-files', 'service/{assetId}/fotos/{timestamp}.jpg · service/{assetId}/docs/…', 'Serviceheft-Anhänge (Fotos + Dokumente aus asset_lifecycle_events)', 'Ja (public read)'],
          ]
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          <div style={{ background: 'var(--adm-bg)', borderRadius: 8, padding: '12px', border: '1px solid var(--adm-border)' }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#fbbf24', fontFamily: 'Arial, sans-serif' }}>Bildkomprimierung</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text2)', fontFamily: 'Arial, sans-serif', lineHeight: 1.5 }}>
              Client-seitig via Canvas API (compress-image.ts).<br />
              Konfigurierbar pro Org in organizations.settings:<br />
              <span style={{ color: '#34d399', fontFamily: "'Courier New', monospace" }}>image_max_dim</span> (default: 1920px) + <span style={{ color: '#34d399', fontFamily: "'Courier New', monospace" }}>image_quality</span> (default: 82%).<br />
              Nur JPEG-Output. Dateien {'<'}100KB werden übersprungen.
            </p>
          </div>
          <div style={{ background: 'var(--adm-bg)', borderRadius: 8, padding: '12px', border: '1px solid var(--adm-border)' }}>
            <p style={{ margin: '0 0 6px', fontSize: 11, fontWeight: 700, color: '#f87171', fontFamily: 'Arial, sans-serif' }}>protect_delete Trigger</p>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--adm-text2)', fontFamily: 'Arial, sans-serif', lineHeight: 1.5 }}>
              Supabase blockiert direktes SQL-DELETE in storage.objects (Trigger).<br />
              Löschung nur via Storage API möglich.<br />
              Daher eigene DELETE-Endpunkte für Asset-/Org-Cleanup.
            </p>
          </div>
        </div>
      </div>

      {/* ── App-Module ───────────────────────────────────────────────── */}
      <h2 style={{ ...S.h2, marginTop: 32 }}>App-Module & Routen</h2>
      <div style={grid3}>
        {[
          {
            module: 'Assets', color: '#0099cc', route: '/assets',
            features: ['CRUD: Anlegen, Bearbeiten, Löschen', 'Bildupload (max. 10, komprimiert)', 'Dokument-Upload (max. 10 MB)', 'QR-Code-Generierung & NFC-UID', 'Standort-Hierarchie (location_ref)', 'Technische & kommerzielle Daten', 'Einheiten-Selektor (130+ Einheiten)', 'Standort-Verlauf', 'Statusverwaltung (custom)'],
          },
          {
            module: 'Serviceheft', color: '#a78bfa', route: '/assets/[id]/service',
            features: ['Serviceeinträge (CRUD)', 'Custom Event-Types', 'Checklisten (JSONB)', 'Anhänge & Kosten', 'Externe Firmen', 'Timeline-Ansicht'],
          },
          {
            module: 'Wartung', color: '#f87171', route: '/wartung',
            features: ['Wartungsintervalle', 'Schritt-für-Schritt-Anleitungen', 'Ressourcenlisten', 'Überfällig-Anzeige', 'Gantt-Ansicht (geplant)', 'Org-weite Übersicht'],
          },
          {
            module: 'Scan / NFC', color: '#34d399', route: '/scan',
            features: ['QR-Code-Scanner (jsQR + Canvas)', 'NFC-Tag-Lesen (Web NFC API)', 'Deep-Link: /assets/{id}', 'Mobile-first Design'],
          },
          {
            module: 'Organisationsstruktur', color: '#fbbf24', route: '/organisation',
            features: ['3-stufige Hierarchie', 'Standorte → Hallen → Bereiche', 'Inline-Edit', 'Asset-Zähler pro Ebene'],
          },
          {
            module: 'Teams', color: '#fb923c', route: '/teams',
            features: ['Team-Verwaltung', 'Mitglieder-Einladung', 'Rollen pro Mitglied', 'Team-Icons', 'Rollenvergabe (Admin/Superadmin)'],
          },
          {
            module: 'Team-Chat', color: '#0099cc', route: '/teams/chat',
            features: ['Echtzeit-Messaging via Supabase Realtime', '@Asset-Erwähnungen mit Asset-Suche-Dropdown', 'Nachrichten rendern als @[Name](uuid) → klickbarer Link', 'Automatisches Löschen nach 30 Tagen (pg_cron)', 'Feature-Toggle per Org (features.teamchat)', 'Rollenfarb-Avatare, Nachrichten gruppiert nach Datum'],
          },
          {
            module: 'Billing', color: '#38bdf8', route: '/settings/billing',
            features: ['Invoice-Only (kein Stripe)', 'Rechnung per E-Mail (Resend)', 'Einmalcode-Einlösung (9-stellig)', 'HMAC-SHA256 Code-Hash', 'Plan-Upgrade per Code'],
          },
          {
            module: 'i18n', color: '#818cf8', route: 'next-intl',
            features: ['28 Sprachen', 'Server- + Client-Komponenten', 'Auto-Detection via Accept-Language', 'Alle Namespaces: assets, service, wartung, teams, docs, billing, …'],
          },
          {
            module: 'Auth', color: '#4ade80', route: '/login, /register, /invite',
            features: ['Supabase Auth (Email + Password)', 'Magic Link (optional)', 'Einladungsflow per Token', 'must_change_password Flag', 'Cloudflare Turnstile (Register)', 'Admin-PIN (SHA-256)'],
          },
        ].map(m => (
          <div key={m.module} style={{ ...S.card, marginBottom: 0 }}>
            <p style={{ margin: '0 0 2px', fontSize: 13, fontWeight: 700, color: m.color }}>{m.module}</p>
            <p style={{ margin: '0 0 10px', fontSize: 10, color: 'var(--adm-text4)', fontFamily: "'Courier New', monospace" }}>{m.route}</p>
            {m.features.map(f => (
              <div key={f} style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 4 }}>
                <div style={{ width: 4, height: 4, borderRadius: '50%', background: m.color, flexShrink: 0, marginTop: 4 }} />
                <span style={{ fontSize: 11, color: 'var(--adm-text3)', fontFamily: 'Arial, sans-serif', lineHeight: 1.4 }}>{f}</span>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* ── Rollen & Berechtigungen ──────────────────────────────────── */}
      <h2 style={{ ...S.h2, marginTop: 16 }}>Rollen & Berechtigungsmatrix</h2>
      <div style={S.card}>
        {table(
          ['Rolle', 'app_role', 'Assets', 'Service', 'Teams', 'Einstellungen', 'Rollen vergeben'],
          [
            ['Superadmin', 'superadmin', '✓ voll', '✓ voll', '✓ voll', '✓ voll', '✓ alle'],
            ['Admin', 'admin', '✓ voll', '✓ voll', '✓ voll', '✓ voll', '✓ bis Admin'],
            ['Techniker', 'techniker', '✓ edit', '✓ edit', '✗ lesen', '✗', '✗'],
            ['Leser', 'leser', '✓ lesen', '✓ lesen', '✗ lesen', '✗', '✗'],
            ['Platform Admin', 'is_platform_admin', 'Admin-Panel', 'Admin-Panel', 'Admin-Panel', 'Admin-Panel', 'Global'],
          ]
        )}
        <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--adm-text4)', fontFamily: 'Arial, sans-serif' }}>
          Farben: Superadmin=#7c3aed (Violett) · Admin=#b45309 (Gold) · Techniker=#475569 (Silber) · Leser=#92400e (Bronze)
          · Rollen-Logik: src/lib/permissions.ts
        </p>
      </div>

      {/* ── Deployment ───────────────────────────────────────────────── */}
      <h2 style={{ ...S.h2, marginTop: 32 }}>Deployment & CI/CD</h2>
      <div style={grid2}>
        <div style={S.card}>
          <h3 style={S.h3}>Vercel</h3>
          {table(
            ['Parameter', 'Wert'],
            [
              ['Framework', 'Next.js (auto-detected)'],
              ['Branch', 'main → Production'],
              ['Build Command', 'next build'],
              ['Output', '.next/ (serverless functions)'],
              ['Edge Runtime', 'Nein (Node.js Runtime)'],
              ['Deploy-Trigger', 'git push origin main'],
            ]
          )}
        </div>
        <div style={S.card}>
          <h3 style={S.h3}>Supabase</h3>
          {table(
            ['Parameter', 'Wert'],
            [
              ['DB', 'PostgreSQL 15 (managed)'],
              ['Auth', 'Supabase Auth (JWT + Cookies)'],
              ['Storage', '3 Buckets (public)'],
              ['Migrations', 'Manuell via SQL-Editor (021 Migrationen)'],
              ['RLS', 'Aktiviert (alle Tabellen)'],
              ['Admin Client', 'Service Role Key (server-only)'],
            ]
          )}
        </div>
      </div>

      {/* ── Env Variablen ────────────────────────────────────────────── */}
      <h2 style={{ ...S.h2, marginTop: 16 }}>Environment Variables</h2>
      <div style={S.card}>
        {table(
          ['Variable', 'Zweck', 'Scope'],
          [
            ['NEXT_PUBLIC_SUPABASE_URL', 'Supabase Projekt-URL', 'Client + Server'],
            ['NEXT_PUBLIC_SUPABASE_ANON_KEY', 'Supabase Anon Key (public, RLS)', 'Client + Server'],
            ['SUPABASE_SERVICE_ROLE_KEY', 'Supabase Service Role (admin, bypasst RLS)', 'Server only'],
            ['RESEND_API_KEY', 'Resend E-Mail-Versand', 'Server only'],
            ['RESEND_FROM_EMAIL', 'Absender-Adresse', 'Server only'],
            ['NEXT_PUBLIC_TURNSTILE_SITE_KEY', 'Cloudflare Turnstile (Register)', 'Client'],
            ['TURNSTILE_SECRET_KEY', 'Cloudflare Turnstile (Verify)', 'Server only'],
            ['SENTRY_DSN', 'Sentry Error Monitoring', 'Server + Client'],
          ]
        )}
      </div>

      {/* ── Dateistruktur ────────────────────────────────────────────── */}
      <h2 style={{ ...S.h2, marginTop: 32 }}>Schlüssel-Dateistruktur</h2>
      <div style={S.card}>
        <div style={{ fontFamily: "'Courier New', monospace", fontSize: 12, lineHeight: 1.8 }}>
          {[
            { indent: 0, text: 'inoid-web/', color: '#e2e8f0' },
            { indent: 1, text: 'src/app/', color: '#60a5fa' },
            { indent: 2, text: '(admin)/admin/          → Admin-Panel (platform_admin only)', color: '#a78bfa' },
            { indent: 2, text: '(dashboard)/            → Kunden-App', color: '#34d399' },
            { indent: 3, text: 'assets/                 → Asset-Management', color: '#9ca3af' },
            { indent: 3, text: 'wartung/                → Wartungsmodul', color: '#9ca3af' },
            { indent: 3, text: 'teams/                  → Team-Verwaltung', color: '#9ca3af' },
            { indent: 3, text: 'teams/chat/              → Team-Chat (ChatClient + Page)', color: '#9ca3af' },
            { indent: 3, text: 'settings/               → Profil, Billing, Rollen, Status', color: '#9ca3af' },
            { indent: 2, text: '(auth)/                 → Login, Register, Invite, PW-Reset', color: '#fbbf24' },
            { indent: 2, text: 'api/                    → Route Handlers (15 Endpunkte)', color: '#f87171' },
            { indent: 1, text: 'src/lib/', color: '#60a5fa' },
            { indent: 2, text: 'supabase/               → client.ts, server.ts, admin.ts', color: '#9ca3af' },
            { indent: 2, text: 'permissions.ts          → ROLE_COLORS, ROLE_BG, can()', color: '#9ca3af' },
            { indent: 2, text: 'compress-image.ts       → Canvas-Bildkomprimierung', color: '#9ca3af' },
            { indent: 2, text: 'compress-pdf.ts          → pdf-lib PDF-Komprimierung (client-side)', color: '#9ca3af' },
            { indent: 2, text: 'plans.ts                → PLANS-Konstante (Pläne & Limits)', color: '#9ca3af' },
            { indent: 1, text: 'src/components/', color: '#60a5fa' },
            { indent: 2, text: 'nav-bottom.tsx          → Mobile Drawer-Navigation', color: '#9ca3af' },
            { indent: 2, text: 'nav-sidebar.tsx         → Desktop Sidebar', color: '#9ca3af' },
            { indent: 2, text: 'org-tree-picker.tsx     → Standort-Hierarchie-Picker', color: '#9ca3af' },
            { indent: 2, text: 'admin/admin-pin-modal   → PIN-Bestätigungs-Modal', color: '#9ca3af' },
            { indent: 1, text: 'messages/               → 28 Sprach-Dateien (JSON)', color: '#fb923c' },
            { indent: 1, text: 'supabase/migrations/    → 021 SQL-Migrationen', color: '#38bdf8' },
          ].map((line, i) => (
            <div key={i} style={{ paddingLeft: line.indent * 20, color: line.color }}>
              {line.text}
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div style={{ marginTop: 40, paddingTop: 20, borderTop: '1px solid var(--adm-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--adm-text4)', fontFamily: 'Arial, sans-serif' }}>INOid.app · Admin-interne Dokumentation · nicht öffentlich zugänglich</span>
        <span style={{ fontSize: 11, color: 'var(--adm-text4)', fontFamily: "'Courier New', monospace" }}>v1.x · Next.js 16.2.2 · Supabase · Vercel</span>
      </div>
    </div>
  )
}
