-- FC Zürich Affoltern – Turniere Anmeldetool
-- Migration: Nur neue Felder und Tabellen hinzufügen
-- (tournaments-Tabelle und ihre Policies existieren bereits)

-- 1. Geburtsdatum zu Spielern
ALTER TABLE players ADD COLUMN IF NOT EXISTS birthdate DATE;

-- 2. Neue Spalten zu Turnieren
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS time TIME;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS modus TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS belag TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS maps_url TEXT;
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS spielplan_url TEXT;

-- 3. Anmeldungen-Tabelle (neu)
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, player_id)
);

ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read tournament_registrations"   ON tournament_registrations FOR SELECT USING (true);
CREATE POLICY "public insert tournament_registrations" ON tournament_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete tournament_registrations" ON tournament_registrations FOR DELETE USING (true);
