-- FC Zürich Affoltern – Turniere Anmeldetool
-- In der GLEICHEN Supabase-DB wie die Anwesenheiten ausführen
-- (players-Tabelle bereits vorhanden)

-- =============================================
-- 1. players: Geburtsdatum hinzufügen
-- =============================================
ALTER TABLE players ADD COLUMN IF NOT EXISTS birthdate DATE;

-- =============================================
-- 2. tournaments (neu: time-Spalte)
-- =============================================
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  time TIME,
  location TEXT,
  category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS time TIME;

-- =============================================
-- 3. tournament_registrations
-- =============================================
CREATE TABLE IF NOT EXISTS tournament_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tournament_id, player_id)
);

-- =============================================
-- RLS Policies (bestehende zuerst löschen)
-- =============================================
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public read tournaments" ON tournaments;
DROP POLICY IF EXISTS "public insert tournaments" ON tournaments;
DROP POLICY IF EXISTS "public update tournaments" ON tournaments;
DROP POLICY IF EXISTS "public delete tournaments" ON tournaments;

CREATE POLICY "public read tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "public insert tournaments" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "public update tournaments" ON tournaments FOR UPDATE USING (true);
CREATE POLICY "public delete tournaments" ON tournaments FOR DELETE USING (true);

DROP POLICY IF EXISTS "public read tournament_registrations" ON tournament_registrations;
DROP POLICY IF EXISTS "public insert tournament_registrations" ON tournament_registrations;
DROP POLICY IF EXISTS "public delete tournament_registrations" ON tournament_registrations;

CREATE POLICY "public read tournament_registrations" ON tournament_registrations FOR SELECT USING (true);
CREATE POLICY "public insert tournament_registrations" ON tournament_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete tournament_registrations" ON tournament_registrations FOR DELETE USING (true);
