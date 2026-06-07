'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Player } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function AufgebotPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [players, setPlayers] = useState<Player[]>([])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [id])

  async function load() {
    setLoading(true)
    const [{ data: playersData }, { data: squadData }] = await Promise.all([
      supabase.from('players').select('*').eq('active', true).order('vorname'),
      supabase.from('tournament_squad').select('player_id').eq('tournament_id', id),
    ])
    setPlayers(playersData ?? [])
    setSelected(new Set((squadData ?? []).map((s: { player_id: string }) => s.player_id)))
    setLoading(false)
  }

  function toggle(playerId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(playerId)) next.delete(playerId)
      else next.add(playerId)
      return next
    })
  }

  async function save() {
    setSaving(true)

    await supabase.from('tournament_squad').delete().eq('tournament_id', id)

    if (selected.size > 0) {
      await supabase.from('tournament_squad').insert(
        [...selected].map((player_id) => ({ tournament_id: id, player_id }))
      )
    }

    router.push(`/turnier/${id}`)
  }

  if (loading) {
    return (
      <div className="space-y-3 animate-pulse">
        <div className="h-8 w-40 rounded bg-muted" />
        {[1,2,3,4,5].map(i => <div key={i} className="h-12 rounded-xl bg-muted" />)}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Aufgebot</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {selected.size} von {players.length} Spielern ausgewählt
        </p>
      </div>

      <div className="space-y-2">
        {players.map((player) => {
          const active = selected.has(player.id)
          return (
            <button
              key={player.id}
              type="button"
              onClick={() => toggle(player.id)}
              className={cn(
                'w-full flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors',
                active
                  ? 'border-primary/60 bg-primary/10 text-foreground'
                  : 'border-border/60 text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              <span>{player.vorname}</span>
              {active && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={() => router.back()} disabled={saving}>
          Abbrechen
        </Button>
        <Button className="flex-1" onClick={save} disabled={saving}>
          {saving ? 'Speichern…' : 'Aufgebot speichern'}
        </Button>
      </div>
    </div>
  )
}
