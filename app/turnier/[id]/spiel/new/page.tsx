'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Player } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NewGamePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [squadPlayers, setSquadPlayers] = useState<Player[]>([])
  const [saving, setSaving] = useState(false)
  const [opponent, setOpponent] = useState('')
  const [goalsFor, setGoalsFor] = useState('')
  const [goalsAgainst, setGoalsAgainst] = useState('')
  const [scorers, setScorers] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState('')

  useEffect(() => {
    supabase
      .from('tournament_squad')
      .select('player_id')
      .eq('tournament_id', id)
      .then(({ data: squadData }) => {
        if (!squadData?.length) return
        supabase
          .from('players')
          .select('*')
          .in('id', squadData.map((s: { player_id: string }) => s.player_id))
          .order('vorname')
          .then(({ data }) => setSquadPlayers(data ?? []))
      })
  }, [id])

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

  const totalScorerGoals = Object.values(scorers).reduce((s, n) => s + n, 0)
  const gf = parseInt(goalsFor) || 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!opponent.trim() || goalsFor === '' || goalsAgainst === '') return
    setSaving(true)

    const { data: gameData, error } = await supabase
      .from('tournament_games')
      .insert({
        tournament_id: id,
        opponent: opponent.trim(),
        goals_for: gf,
        goals_against: parseInt(goalsAgainst) || 0,
        notes: notes.trim() || null,
      })
      .select()
      .single()

    if (error || !gameData) { setSaving(false); return }

    if (Object.keys(scorers).length > 0) {
      await supabase.from('tournament_goals').insert(
        Object.entries(scorers).map(([player_id, count]) => ({
          tournament_id: id,
          game_id: gameData.id,
          player_id,
          count,
        }))
      )
    }

    router.push(`/turnier/${id}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Spiel erfassen</h1>
        <p className="text-sm text-muted-foreground mt-1">Resultat und Torschützen eintragen</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="opponent">Gegner *</Label>
          <Input
            id="opponent"
            placeholder="z.B. FC Schwamendingen"
            value={opponent}
            onChange={(e) => setOpponent(e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="gf">Tore FCA *</Label>
            <Input
              id="gf"
              type="number"
              min="0"
              placeholder="0"
              value={goalsFor}
              onChange={(e) => setGoalsFor(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ga">Gegentore *</Label>
            <Input
              id="ga"
              type="number"
              min="0"
              placeholder="0"
              value={goalsAgainst}
              onChange={(e) => setGoalsAgainst(e.target.value)}
              required
            />
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
                      <button
                        type="button"
                        onClick={() => setGoals(player.id, -1)}
                        disabled={count === 0}
                        className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
                      >
                        −
                      </button>
                      <span className={`text-sm font-bold w-4 text-center ${count > 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                        {count}
                      </span>
                      <button
                        type="button"
                        onClick={() => setGoals(player.id, 1)}
                        className="w-7 h-7 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      >
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
          <Input
            id="notes"
            placeholder="Optional..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()} disabled={saving}>
            Abbrechen
          </Button>
          <Button type="submit" className="flex-1" disabled={saving || !opponent || goalsFor === '' || goalsAgainst === ''}>
            {saving ? 'Speichern…' : 'Spiel speichern'}
          </Button>
        </div>
      </form>
    </div>
  )
}
