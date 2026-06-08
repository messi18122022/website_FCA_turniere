'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'

interface Game {
  id: string
  opponent: string
  goals_fca: number
  goals_opponent: number
  own_goals?: number
}

interface GoalEntry {
  game_id: string
  player_id: string
  goals_count: number
}

export interface AufgebotPlayer {
  id: string
  vorname: string
}

interface Props {
  tournamentId: string
  aufgebotPlayers: AufgebotPlayer[]
  playerMap: Record<string, string>
  mode: 'trainer' | 'read'
}

export default function GameSection({ tournamentId, aufgebotPlayers, playerMap, mode }: Props) {
  const [games, setGames] = useState<Game[]>([])
  const [goals, setGoals] = useState<GoalEntry[]>([])
  const [loaded, setLoaded] = useState(false)
  const [adding, setAdding] = useState(false)
  const [addOpponent, setAddOpponent] = useState('')
  const [addFca, setAddFca] = useState(0)
  const [addOpp, setAddOpp] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editOpponent, setEditOpponent] = useState('')
  const [editFca, setEditFca] = useState(0)
  const [editOppGoals, setEditOppGoals] = useState(0)
  const [editOwnGoals, setEditOwnGoals] = useState(0)
  const [editPlayerGoals, setEditPlayerGoals] = useState<Record<string, number>>({})

  useEffect(() => {
    async function load() {
      const { data: gData } = await supabase
        .from('tournament_games')
        .select('id, opponent, goals_fca, goals_opponent, own_goals')
        .eq('tournament_id', tournamentId)
        .order('created_at')
      const gs = (gData ?? []) as Game[]
      setGames(gs)
      if (gs.length > 0) {
        const { data: glData } = await supabase
          .from('game_goals')
          .select('game_id, player_id, goals_count')
          .in('game_id', gs.map(g => g.id))
        setGoals((glData ?? []) as GoalEntry[])
      }
      setLoaded(true)
    }
    load()
  }, [tournamentId])

  async function reload() {
    const { data: gData } = await supabase
      .from('tournament_games')
      .select('id, opponent, goals_fca, goals_opponent, own_goals')
      .eq('tournament_id', tournamentId)
      .order('created_at')
    const gs = (gData ?? []) as Game[]
    setGames(gs)
    if (gs.length > 0) {
      const { data: glData } = await supabase
        .from('game_goals')
        .select('game_id, player_id, goals_count')
        .in('game_id', gs.map(g => g.id))
      setGoals((glData ?? []) as GoalEntry[])
    } else {
      setGoals([])
    }
  }

  function startEdit(game: Game) {
    const pg: Record<string, number> = {}
    for (const p of aufgebotPlayers) {
      const entry = goals.find(g => g.game_id === game.id && g.player_id === p.id)
      pg[p.id] = entry?.goals_count ?? 0
    }
    setEditId(game.id)
    setEditOpponent(game.opponent)
    setEditFca(game.goals_fca)
    setEditOppGoals(game.goals_opponent)
    setEditOwnGoals(game.own_goals ?? 0)
    setEditPlayerGoals(pg)
  }

  function cancelEdit() {
    setEditId(null)
    setEditOpponent('')
    setEditFca(0)
    setEditOppGoals(0)
    setEditOwnGoals(0)
    setEditPlayerGoals({})
  }

  async function saveEdit() {
    if (!editId) return
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('tournament_games').update({
      opponent: editOpponent.trim() || 'Gegner',
      goals_fca: editFca,
      goals_opponent: editOppGoals,
      own_goals: editOwnGoals,
    }).eq('id', editId)
    if (err) { setError(err.message); setSaving(false); return }
    await supabase.from('game_goals').delete().eq('game_id', editId)
    const inserts = Object.entries(editPlayerGoals)
      .filter(([, c]) => c > 0)
      .map(([player_id, goals_count]) => ({ game_id: editId as string, player_id, goals_count }))
    if (inserts.length > 0) await supabase.from('game_goals').insert(inserts)
    setSaving(false)
    cancelEdit()
    await reload()
  }

  async function deleteGame(gameId: string) {
    await supabase.from('game_goals').delete().eq('game_id', gameId)
    await supabase.from('tournament_games').delete().eq('id', gameId)
    cancelEdit()
    await reload()
  }

  async function addGame() {
    if (!addOpponent.trim()) return
    setSaving(true)
    setError(null)
    const { error: err } = await supabase.from('tournament_games').insert({
      tournament_id: tournamentId,
      opponent: addOpponent.trim(),
      goals_fca: addFca,
      goals_opponent: addOpp,
    })
    setSaving(false)
    if (err) { setError(err.message); return }
    setAdding(false)
    setAddOpponent('')
    setAddFca(0)
    setAddOpp(0)
    await reload()
  }

  function scorerText(gameId: string): string {
    const entries = goals.filter(g => g.game_id === gameId)
    return entries
      .map(e => {
        const name = playerMap[e.player_id] ?? '?'
        return e.goals_count > 1 ? `${name} (${e.goals_count})` : name
      })
      .join(', ')
  }

  if (mode === 'read' && loaded && games.length === 0) return null

  const hasAufgebot = aufgebotPlayers.length > 0
  const isInteracting = adding || editId !== null

  return (
    <div className="mt-3 pt-3 border-t border-border/40">
      {error && (
        <p className="text-xs text-red-500 mb-2 bg-red-500/10 rounded-lg px-2 py-1">{error}</p>
      )}
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Spiele</p>
        {mode === 'trainer' && !isInteracting && (
          <button
            onClick={() => setAdding(true)}
            className="w-6 h-6 rounded-full bg-green-500/20 text-green-600 hover:bg-green-500/30 transition-colors flex items-center justify-center"
            aria-label="Spiel hinzufügen"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-2">
        {games.map(game => (
          <div key={game.id}>
            {editId === game.id ? (
              <div className="rounded-lg bg-muted/40 p-3 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-primary shrink-0">FCA</span>
                  <input
                    type="number" min={0}
                    value={editFca}
                    onChange={e => setEditFca(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-10 h-8 rounded-md border border-border bg-background text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-sm font-bold shrink-0">:</span>
                  <input
                    type="number" min={0}
                    value={editOppGoals}
                    onChange={e => setEditOppGoals(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-10 h-8 rounded-md border border-border bg-background text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="text"
                    value={editOpponent}
                    onChange={e => setEditOpponent(e.target.value)}
                    placeholder="Gegner"
                    className="flex-1 min-w-0 h-8 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                {hasAufgebot && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">Torschützen</p>
                    {aufgebotPlayers.map(p => (
                      <div key={p.id} className="flex items-center justify-between">
                        <span className="text-sm">{p.vorname}</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditPlayerGoals(prev => ({ ...prev, [p.id]: Math.max(0, (prev[p.id] ?? 0) - 1) }))}
                            className="w-6 h-6 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors flex items-center justify-center text-sm font-bold leading-none"
                          >−</button>
                          <span className="w-5 text-center text-sm font-semibold tabular-nums">{editPlayerGoals[p.id] ?? 0}</span>
                          <button
                            onClick={() => setEditPlayerGoals(prev => ({ ...prev, [p.id]: (prev[p.id] ?? 0) + 1 }))}
                            className="w-6 h-6 rounded-md bg-green-500/20 text-green-600 hover:bg-green-500/30 transition-colors flex items-center justify-center text-sm font-bold leading-none"
                          >+</button>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground italic">Eigentor</span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setEditOwnGoals(prev => Math.max(0, prev - 1))}
                          className="w-6 h-6 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 transition-colors flex items-center justify-center text-sm font-bold leading-none"
                        >−</button>
                        <span className="w-5 text-center text-sm font-semibold tabular-nums">{editOwnGoals}</span>
                        <button
                          onClick={() => setEditOwnGoals(prev => prev + 1)}
                          className="w-6 h-6 rounded-md bg-green-500/20 text-green-600 hover:bg-green-500/30 transition-colors flex items-center justify-center text-sm font-bold leading-none"
                        >+</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => deleteGame(game.id)}
                    className="h-7 px-2.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center gap-1 text-xs font-semibold"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                    </svg>
                    Löschen
                  </button>
                  <div className="flex gap-1.5">
                    <button onClick={cancelEdit} className="h-7 w-7 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                    <button onClick={saveEdit} disabled={saving} className="h-7 w-7 rounded-lg bg-green-500/20 text-green-600 hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className={cn('font-bold shrink-0', game.goals_fca > game.goals_opponent ? 'text-green-600' : game.goals_fca < game.goals_opponent ? 'text-red-500' : 'text-muted-foreground')}>FCA</span>
                    <span className="font-bold shrink-0">{game.goals_fca}:{game.goals_opponent}</span>
                    <span className="text-muted-foreground truncate">{game.opponent}</span>
                  </div>
                  {(() => {
                    const t = scorerText(game.id)
                    return t ? <p className="text-xs text-muted-foreground mt-0.5">{t}</p> : null
                  })()}
                </div>
                {mode === 'trainer' && !isInteracting && (
                  <button onClick={() => startEdit(game)} className="shrink-0 text-xs px-2.5 py-1 rounded-lg border border-border/60 text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted/50 transition-all">
                    Bearbeiten
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {adding && (
          <div className="rounded-lg bg-muted/40 p-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-primary shrink-0">FCA</span>
              <input
                type="number" min={0} value={addFca}
                onChange={e => setAddFca(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-10 h-8 rounded-md border border-border bg-background text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-sm font-bold shrink-0">:</span>
              <input
                type="number" min={0} value={addOpp}
                onChange={e => setAddOpp(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-10 h-8 rounded-md border border-border bg-background text-center text-sm font-bold focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <input
                type="text" value={addOpponent}
                onChange={e => setAddOpponent(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addGame() }}
                placeholder="Gegner" autoFocus
                className="flex-1 min-w-0 h-8 rounded-md border border-border bg-background px-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <button onClick={() => { setAdding(false); setAddOpponent(''); setAddFca(0); setAddOpp(0) }} className="w-8 h-8 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
              <button onClick={addGame} disabled={saving || !addOpponent.trim()} className="w-8 h-8 rounded-lg bg-green-500/20 text-green-600 hover:bg-green-500/30 transition-colors disabled:opacity-50 flex items-center justify-center shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        {loaded && games.length === 0 && !adding && mode === 'trainer' && (
          <p className="text-xs text-muted-foreground">Noch keine Spiele erfasst.</p>
        )}
      </div>
    </div>
  )
}
