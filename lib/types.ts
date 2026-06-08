export interface Player {
  id: string
  vorname: string
  active: boolean
  birthdate: string | null
  joined_at: string
  left_at: string | null
  created_at: string
}

export interface Tournament {
  id: string
  name: string
  date: string
  time: string | null
  location: string | null
  modus: string | null
  belag: 'Halle' | 'Rasen' | null
  maps_url: string | null
  spielplan_url: string | null
  notes: string | null
  abgeschlossen: boolean
  rang: number | null
  total_teams: number | null
  created_at: string
}

export interface TournamentRegistration {
  id: string
  tournament_id: string
  player_id: string
  created_at: string
}

export interface TournamentWithCount extends Tournament {
  registration_count: number
}
