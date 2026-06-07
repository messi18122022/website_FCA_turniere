-- FC Zürich Affoltern – Turniere Schema
-- In der GLEICHEN Supabase-DB wie die Anwesenheiten ausführen
-- (players-Tabelle ist bereits vorhanden)

CREATE TABLE tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  date DATE NOT NULL,
  location TEXT,
  category TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tournament_games (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  opponent TEXT NOT NULL,
  goals_for INTEGER NOT NULL DEFAULT 0,
  goals_against INTEGER NOT NULL DEFAULT 0,
  game_order INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tournament_squad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  UNIQUE(tournament_id, player_id)
);

CREATE TABLE tournament_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID REFERENCES tournaments(id) ON DELETE CASCADE,
  game_id UUID REFERENCES tournament_games(id) ON DELETE CASCADE,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  count INTEGER NOT NULL DEFAULT 1
);

-- RLS
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_squad ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read tournaments" ON tournaments FOR SELECT USING (true);
CREATE POLICY "public insert tournaments" ON tournaments FOR INSERT WITH CHECK (true);
CREATE POLICY "public update tournaments" ON tournaments FOR UPDATE USING (true);
CREATE POLICY "public delete tournaments" ON tournaments FOR DELETE USING (true);

CREATE POLICY "public read tournament_games" ON tournament_games FOR SELECT USING (true);
CREATE POLICY "public insert tournament_games" ON tournament_games FOR INSERT WITH CHECK (true);
CREATE POLICY "public update tournament_games" ON tournament_games FOR UPDATE USING (true);
CREATE POLICY "public delete tournament_games" ON tournament_games FOR DELETE USING (true);

CREATE POLICY "public read tournament_squad" ON tournament_squad FOR SELECT USING (true);
CREATE POLICY "public insert tournament_squad" ON tournament_squad FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete tournament_squad" ON tournament_squad FOR DELETE USING (true);

CREATE POLICY "public read tournament_goals" ON tournament_goals FOR SELECT USING (true);
CREATE POLICY "public insert tournament_goals" ON tournament_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "public delete tournament_goals" ON tournament_goals FOR DELETE USING (true);
