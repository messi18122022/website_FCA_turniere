export interface Player {
  id: string
  vorname: string
  active: boolean
  joined_at: string
  left_at: string | null
  created_at: string
}

export interface Tournament {
  id: string
  name: string
  date: string
  location: string | null
  category: string | null
  notes: string | null
  created_at: string
}

export interface TournamentGame {
  id: string
  tournament_id: string
  opponent: string
  goals_for: number
  goals_against: number
  game_order: number | null
  notes: string | null
  created_at: string
}

export interface TournamentSquad {
  id: string
  tournament_id: string
  player_id: string
}

export interface TournamentGoal {
  id: string
  tournament_id: string
  game_id: string
  player_id: string
  count: number
}

export interface TournamentWithStats extends Tournament {
  game_count: number
  wins: number
  draws: number
  losses: number
  goals_for: number
  goals_against: number
  squad_count: number
}

export interface GameWithGoals extends TournamentGame {
  goals: (TournamentGoal & { players: Player })[]
}
