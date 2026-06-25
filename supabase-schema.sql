-- Flipper Vertrieb Board — Supabase-Schema
-- Im Supabase-Dashboard unter "SQL Editor" einmal ausführen.

-- Das gesamte Board liegt als ein JSON-Dokument in einer Zeile.
-- Schnellster Migrationsweg (spiegelt das Client-Modell 1:1).
-- Schwelle zum Normalisieren in echte Tabellen: regelmäßiges paralleles
-- Editieren durch mehrere Personen ODER Bedarf an Server-Queries/Reports.
create table if not exists board_state (
  id         text primary key,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Zugriff erfolgt ausschließlich über den Railway-Server (Service-Key),
-- nicht direkt aus dem Browser. RLS bleibt daher aus.
alter table board_state disable row level security;
