'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Player, TournamentGoal, TournamentGame, TournamentSquad } from '@/lib/types'

interface PlayerStats {
  player: Player
  goals: number
  tournaments: number
  games: number
  wins: number
}

export default function StatisticsPage() {
  const [stats, setStats] = useState<PlayerStats[]>([])
  const [totalGames, setTotalGames] = useState(0)
  const [totalTournaments, setTotalTournaments] = useState(0)
  const [totalGoals, setTotalGoals] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)

    const [
      { data: playersData },
      { data: goalsData },
      { data: gamesData },
      { data: squadData },
    ] = await Promise.all([
      supabase.from('players').select('*').order('vorname'),
      supabase.from('tournament_goals').select('*'),
      supabase.from('tournament_games').select('*'),
      supabase.from('tournament_squad').select('*'),
    ])

    const players: Player[] = playersData ?? []
    const goals: TournamentGoal[] = goalsData ?? []
    const games: TournamentGame[] = gamesData ?? []
    const squad: TournamentSquad[] = squadData ?? []

    setTotalGames(games.length)
    setTotalTournaments(new Set(games.map((g) => g.tournament_id)).size)
    setTotalGoals(goals.reduce((s, g) => s + g.count, 0))

    const playerStats: PlayerStats[] = players.map((player) => {
      const playerGoals = goals.filter((g) => g.player_id === player.id).reduce((s, g) => s + g.count, 0)
      const tournamentIds = [...new Set(squad.filter((s) => s.player_id === player.id).map((s) => s.tournament_id))]
      const playerGames = games.filter((g) => tournamentIds.includes(g.tournament_id))
      const playerWins = playerGames.filter((g) => g.goals_for > g.goals_against).length

      return {
        player,
        goals: playerGoals,
        tournaments: tournamentIds.length,
        games: playerGames.length,
        wins: playerWins,
      }
    }).filter((s) => s.tournaments > 0 || s.goals > 0)

    playerStats.sort((a, b) => b.goals - a.goals || b.tournaments - a.tournaments)
    setStats(playerStats)
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 w-40 rounded bg-muted" />
        <div className="grid grid-cols-3 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-muted" />)}
        </div>
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-xl bg-muted" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-extrabold tracking-tight">Statistiken</h1>

      {/* Gesamt-Übersicht */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Turniere', val: totalTournaments },
          { label: 'Spiele', val: totalGames },
          { label: 'Tore', val: totalGoals },
        ].map(({ label, val }) => (
          <div key={label} className="rounded-xl border border-border/60 p-3 text-center">
            <div className="text-2xl font-extrabold text-primary">{val}</div>
            <div className="text-xs text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Torschützenliste */}
      {stats.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-bold text-base">Torschützenliste</h2>
          <div className="space-y-2">
            {stats.map((s, idx) => (
              <div key={s.player.id} className="flex items-center gap-3 rounded-xl border border-border/60 px-4 py-3">
                <span className="text-sm text-muted-foreground w-5 shrink-0 text-right">{idx + 1}</span>
                <span className="flex-1 text-sm font-medium">{s.player.vorname}</span>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{s.tournaments} Turniere</span>
                  <span>{s.games} Spiele</span>
                </div>
                <span className="text-sm font-bold text-primary shrink-0">
                  {s.goals > 0 ? `⚽ ${s.goals}` : '–'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">📊</p>
          <p className="text-muted-foreground text-sm">Noch keine Statistiken vorhanden.</p>
        </div>
      )}
    </div>
  )
}
