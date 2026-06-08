'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface ScorerRow {
  name: string
  goals: number
}

interface StatsData {
  played: number
  wins: number
  draws: number
  losses: number
  goalsFca: number
  goalsOpp: number
  scorers: ScorerRow[]
}

export default function StatsContent() {
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: gamesData }, { data: goalsData }, { data: playersData }] = await Promise.all([
        supabase.from('tournament_games').select('goals_fca, goals_opponent'),
        supabase.from('game_goals').select('player_id, goals_count'),
        supabase.from('players').select('id, vorname'),
      ])

      const games = gamesData ?? []
      const goals = goalsData ?? []
      const players = playersData ?? []

      const pm: Record<string, string> = {}
      for (const p of players) pm[p.id] = p.vorname

      let wins = 0, draws = 0, losses = 0, goalsFca = 0, goalsOpp = 0
      for (const g of games) {
        goalsFca += g.goals_fca ?? 0
        goalsOpp += g.goals_opponent ?? 0
        if (g.goals_fca > g.goals_opponent) wins++
        else if (g.goals_fca === g.goals_opponent) draws++
        else losses++
      }

      const scorerMap: Record<string, number> = {}
      for (const g of goals) {
        scorerMap[g.player_id] = (scorerMap[g.player_id] ?? 0) + (g.goals_count ?? 0)
      }
      const scorers: ScorerRow[] = Object.entries(scorerMap)
        .map(([id, goals]) => ({ name: pm[id] ?? '?', goals }))
        .filter(s => s.goals > 0)
        .sort((a, b) => b.goals - a.goals)

      setStats({ played: games.length, wins, draws, losses, goalsFca, goalsOpp, scorers })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-muted" />)}
      </div>
    )
  }

  if (!stats) return null

  const { played, wins, draws, losses, goalsFca, goalsOpp, scorers } = stats

  return (
    <div className="space-y-6">
      {/* Gesamtbilanz */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Gesamtbilanz</h2>

        {played === 0 ? (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">⚽</p>
            <p className="text-sm text-muted-foreground">Noch keine Spiele erfasst.</p>
          </div>
        ) : (
          <>
            {/* W/D/L */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-green-500/10 px-3 py-4 text-center">
                <p className="text-2xl font-extrabold text-green-600">{wins}</p>
                <p className="text-xs text-green-700 font-medium mt-0.5">Siege</p>
              </div>
              <div className="rounded-xl bg-muted px-3 py-4 text-center">
                <p className="text-2xl font-extrabold text-muted-foreground">{draws}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Unentschieden</p>
              </div>
              <div className="rounded-xl bg-red-500/10 px-3 py-4 text-center">
                <p className="text-2xl font-extrabold text-red-500">{losses}</p>
                <p className="text-xs text-red-600 font-medium mt-0.5">Niederlagen</p>
              </div>
            </div>

            {/* Goals */}
            <div className="rounded-xl border border-border/60 px-4 py-4 flex items-center justify-between gap-3">
              <div className="text-center flex-1">
                <p className={cn('text-3xl font-extrabold', goalsFca > goalsOpp ? 'text-green-600' : goalsFca < goalsOpp ? 'text-red-500' : 'text-foreground')}>{goalsFca}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">FCA Tore</p>
              </div>
              <span className="text-2xl font-bold text-muted-foreground">:</span>
              <div className="text-center flex-1">
                <p className={cn('text-3xl font-extrabold', goalsOpp > goalsFca ? 'text-red-500' : goalsOpp < goalsFca ? 'text-green-600' : 'text-foreground')}>{goalsOpp}</p>
                <p className="text-xs text-muted-foreground font-medium mt-0.5">Gegner Tore</p>
              </div>
            </div>

            {/* Played */}
            <p className="text-xs text-center text-muted-foreground">{played} {played === 1 ? 'Spiel' : 'Spiele'} gespielt</p>
          </>
        )}
      </section>

      {/* Torschützenliste */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Torschützenliste</h2>

        {scorers.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-3xl mb-2">🎯</p>
            <p className="text-sm text-muted-foreground">Noch keine Torschützen erfasst.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-border/60 overflow-hidden">
            {scorers.map((s, i) => (
              <div
                key={s.name}
                className={cn(
                  'flex items-center gap-3 px-4 py-3',
                  i !== scorers.length - 1 && 'border-b border-border/40'
                )}
              >
                <span className="w-6 text-center text-sm shrink-0">
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : (
                    <span className="text-xs text-muted-foreground font-medium">{i + 1}.</span>
                  )}
                </span>
                <span className="flex-1 text-sm font-medium">{s.name}</span>
                <span className={cn(
                  'text-sm font-extrabold tabular-nums',
                  i === 0 ? 'text-yellow-600' : i === 1 ? 'text-slate-400' : i === 2 ? 'text-orange-500' : 'text-foreground'
                )}>{s.goals}</span>
                <span className="text-xs text-muted-foreground">{s.goals === 1 ? 'Tor' : 'Tore'}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
