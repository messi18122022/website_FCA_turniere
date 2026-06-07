'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { Tournament, TournamentGame, Player, TournamentGoal } from '@/lib/types'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface GameRow extends TournamentGame {
  scorers: { player: Player; count: number }[]
}

interface SquadPlayer {
  player: Player
  goals: number
}

function resultLabel(g: TournamentGame) {
  if (g.goals_for > g.goals_against) return { label: 'S', cls: 'text-primary bg-primary/15' }
  if (g.goals_for < g.goals_against) return { label: 'N', cls: 'text-destructive bg-destructive/15' }
  return { label: 'U', cls: 'text-muted-foreground bg-muted' }
}

export default function TournamentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [games, setGames] = useState<GameRow[]>([])
  const [squad, setSquad] = useState<SquadPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)

    const [{ data: tData }, { data: gData }, { data: squadData }, { data: goalsData }, { data: playersData }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('tournament_games').select('*').eq('tournament_id', id).order('game_order', { ascending: true }).order('created_at', { ascending: true }),
      supabase.from('tournament_squad').select('player_id').eq('tournament_id', id),
      supabase.from('tournament_goals').select('*').eq('tournament_id', id),
      supabase.from('players').select('*').order('vorname'),
    ])

    if (!tData) { setLoading(false); router.push('/'); return }
    setTournament(tData)

    const allPlayers: Player[] = playersData ?? []
    const goals: TournamentGoal[] = goalsData ?? []

    const gameRows: GameRow[] = (gData ?? []).map((g: TournamentGame) => {
      const gameGoals = goals.filter((gl) => gl.game_id === g.id)
      const scorers = gameGoals
        .map((gl) => ({
          player: allPlayers.find((p) => p.id === gl.player_id)!,
          count: gl.count,
        }))
        .filter((s) => s.player)
      return { ...g, scorers }
    })
    setGames(gameRows)

    const squadPlayers: SquadPlayer[] = (squadData ?? [])
      .map((s: { player_id: string }) => {
        const player = allPlayers.find((p) => p.id === s.player_id)
        if (!player) return null
        const playerGoals = goals.filter((g) => g.player_id === s.player_id).reduce((sum, g) => sum + g.count, 0)
        return { player, goals: playerGoals }
      })
      .filter(Boolean) as SquadPlayer[]
    squadPlayers.sort((a, b) => b.goals - a.goals || a.player.vorname.localeCompare(b.player.vorname))
    setSquad(squadPlayers)

    setLoading(false)
  }

  async function deleteTournament() {
    if (!confirm('Turnier wirklich löschen?')) return
    setDeleting(true)
    await supabase.from('tournaments').delete().eq('id', id)
    router.push('/')
  }

  if (loading) {
    return (
      <div className="space-y-5 animate-pulse">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="space-y-3 mt-6">
          {[1,2,3].map(i => <div key={i} className="h-14 rounded-xl bg-muted" />)}
        </div>
      </div>
    )
  }

  if (!tournament) return null

  const totalGoalsFor = games.reduce((s, g) => s + g.goals_for, 0)
  const totalGoalsAgainst = games.reduce((s, g) => s + g.goals_against, 0)
  const wins = games.filter((g) => g.goals_for > g.goals_against).length
  const draws = games.filter((g) => g.goals_for === g.goals_against).length
  const losses = games.filter((g) => g.goals_for < g.goals_against).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {tournament.category && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                  {tournament.category}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">{tournament.name}</h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap">
              <span>{format(new Date(tournament.date), 'd. MMMM yyyy', { locale: de })}</span>
              {tournament.location && <><span>·</span><span>{tournament.location}</span></>}
            </div>
          </div>
          <button
            onClick={deleteTournament}
            disabled={deleting}
            className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-muted"
            title="Turnier löschen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
        </div>

        {/* Bilanz-Summary */}
        {games.length > 0 && (
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[
              { label: 'Spiele', val: games.length, cls: '' },
              { label: 'Siege', val: wins, cls: wins > 0 ? 'text-primary' : '' },
              { label: 'Unentsch.', val: draws, cls: '' },
              { label: 'Niederl.', val: losses, cls: losses > 0 ? 'text-destructive' : '' },
            ].map(({ label, val, cls }) => (
              <div key={label} className="rounded-xl border border-border/60 p-3 text-center">
                <div className={cn('text-xl font-bold', cls)}>{val}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spiele */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">
            Spiele
            {games.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {totalGoalsFor}:{totalGoalsAgainst} Tore
              </span>
            )}
          </h2>
          <Link
            href={`/turnier/${id}/spiel/new`}
            className={cn(buttonVariants({ size: 'sm' }), 'rounded-lg h-8 px-3 text-xs')}
          >
            + Spiel
          </Link>
        </div>

        {games.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">Noch keine Spiele erfasst.</p>
        )}

        <div className="space-y-2">
          {games.map((game, idx) => {
            const res = resultLabel(game)
            return (
              <Link
                key={game.id}
                href={`/turnier/${id}/spiel/${game.id}`}
                className="flex items-center gap-3 rounded-xl border border-border/60 px-4 py-3 hover:border-border transition-colors"
              >
                <span className="text-xs text-muted-foreground w-4 shrink-0">{idx + 1}</span>
                <span className={cn('text-xs font-bold w-5 h-5 rounded-md flex items-center justify-center shrink-0', res.cls)}>
                  {res.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">vs. {game.opponent}</div>
                  {game.scorers.length > 0 && (
                    <div className="text-xs text-muted-foreground truncate">
                      ⚽ {game.scorers.map((s) => s.count > 1 ? `${s.player.vorname} (${s.count})` : s.player.vorname).join(', ')}
                    </div>
                  )}
                </div>
                <span className="text-sm font-bold shrink-0">
                  {game.goals_for}:{game.goals_against}
                </span>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Aufgebot */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">
            Aufgebot
            {squad.length > 0 && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">{squad.length} Spieler</span>
            )}
          </h2>
          <Link
            href={`/turnier/${id}/aufgebot`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-lg h-8 px-3 text-xs')}
          >
            Bearbeiten
          </Link>
        </div>

        {squad.length === 0 && (
          <p className="text-sm text-muted-foreground py-4 text-center">Noch kein Aufgebot erfasst.</p>
        )}

        {squad.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {squad.map(({ player, goals }) => (
              <div key={player.id} className="flex items-center justify-between rounded-xl border border-border/60 px-3 py-2.5">
                <span className="text-sm font-medium">{player.vorname}</span>
                {goals > 0 && (
                  <span className="text-xs text-primary font-semibold">⚽ {goals}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {tournament.notes && (
        <div className="rounded-xl border border-border/60 px-4 py-3 text-sm text-muted-foreground">
          {tournament.notes}
        </div>
      )}
    </div>
  )
}
