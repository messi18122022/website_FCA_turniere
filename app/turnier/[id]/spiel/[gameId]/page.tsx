'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Player, TournamentGame, TournamentGoal } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function EditGamePage() {
  const { id, gameId } = useParams<{ id: string; gameId: string }>()
  const router = useRouter()

  const [squadPlayers, setSquadPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [opponent, setOpponent] = useState('')
  const [goalsFor, setGoalsFor] = useState('')
  const [goalsAgainst, setGoalsAgainst] = useState('')
  const [scorers, setScorers] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')

  useEffect(() => { load() }, [gameId])

  async function load() {
    setLoading(true)
    const [{ data: gameData }, { data: squadData }, { data: goalsData }] = await Promise.all([
      supabase.from('tournament_games').select('*').eq('id', gameId).single(),
      supabase.from('tournament_squad').select('player_id').eq('tournament_id', id),
      supabase.from('tournament_goals').select('*').eq('game_id', gameId),
    ])

    if (!gameData) { setLoading(false); router.push(`/turnier/${id}`); return }

    const game: TournamentGame = gameData
    setOpponent(game.opponent)
    setGoalsFor(String(game.goals_for))
    setGoalsAgainst(String(game.goals_against))
    setNotes(game.notes ?? '')

    const initScorers: Record<string, number> = {}
    for (const g of (goalsData ?? []) as TournamentGoal[]) {
      initScorers[g.player_id] = g.count
    }
    setScorers(initScorers)

    if (squadData?.length) {
      const { data: players } = await supabase
        .from('players')
        .select('*')
        .in('id', (squadData as { player_id: string }[]).map((s) => s.player_id))
        .order('vorname')
      setSquadPlayers(players ?? [])
    }

    setLoading(false)
  }

  function setGoals(playerId: string, delta: number) {
    setScorers((prev) => {
      const current = prev[playerId] ?? 0
      const next = Math.max(0, current + delta)
      if (next === 0) {
        const { [playerId]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [playerId]: next }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    await supabase.from('tournament_games').update({
      opponent: opponent.trim(),
      goals_for: parseInt(goalsFor) || 0,
      goals_against: parseInt(goalsAgainst) || 0,
      notes: notes.trim() || null,
    }).eq('id', gameId)

    await supabase.from('tournament_goals').delete().eq('game_id', gameId)

    if (Object.keys(scorers).length > 0) {
      await supabase.from('tournament_goals').insert(
        Object.entries(scorers).map(([player_id, count]) => ({
          tournament_id: id,
          game_id: gameId,
          player_id,
          count,
        }))
      )
    }

    router.push(`/turnier/${id}`)
  }

  async function deleteGame() {
    if (!confirm('Spiel wirklich löschen?')) return
    setDeleting(true)
    await supabase.from('tournament_games').delete().eq('id', gameId)
    router.push(`/turnier/${id}`)
  }

  if (loading) {
    return <div className="space-y-3 animate-pulse">{[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-muted" />)}</div>
  }

  const totalScorerGoals = Object.values(scorers).reduce((s, n) => s + n, 0)
  const gf = parseInt(goalsFor) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Spiel bearbeiten</h1>
          <p className="text-sm text-muted-foreground mt-1">vs. {opponent}</p>
        </div>
        <button
          onClick={deleteGame}
          disabled={deleting}
          className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-muted"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14H6L5 6"/>
            <path d="M10 11v6M14 11v6"/>
            <path d="M9 6V4h6v2"/>
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="opponent">Gegner</Label>
          <Input id="opponent" value={opponent} onChange={(e) => setOpponent(e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="gf">Tore FCA</Label>
            <Input id="gf" type="number" min="0" value={goalsFor} onChange={(e) => setGoalsFor(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ga">Gegentore</Label>
            <Input id="ga" type="number" min="0" value={goalsAgainst} onChange={(e) => setGoalsAgainst(e.target.value)} required />
          </div>
        </div>

        {squadPlayers.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Torschützen</Label>
              {totalScorerGoals > 0 && (
                <span className={`text-xs ${totalScorerGoals === gf ? 'text-primary' : 'text-destructive'}`}>
                  {totalScorerGoals}/{gf} Tore verteilt
                </span>
              )}
            </div>
            <div className="space-y-2">
              {squadPlayers.map((player) => {
                const count = scorers[player.id] ?? 0
                return (
                  <div key={player.id} className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-2.5">
                    <span className="text-sm font-medium">{player.vorname}</span>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => setGoals(player.id, -1)} disabled={count === 0}
                        className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                        −
                      </button>
                      <span className={`text-sm font-bold w-4 text-center ${count > 0 ? 'text-primary' : 'text-muted-foreground'}`}>{count}</span>
                      <button type="button" onClick={() => setGoals(player.id, 1)}
                        className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        +
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="notes">Notizen</Label>
          <Input id="notes" placeholder="Optional..." value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()} disabled={saving}>
            Abbrechen
          </Button>
          <Button type="submit" className="flex-1" disabled={saving}>
            {saving ? 'Speichern…' : 'Änderungen speichern'}
          </Button>
        </div>
      </form>
    </div>
  )
}
