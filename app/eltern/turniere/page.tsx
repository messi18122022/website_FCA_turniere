'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { Tournament } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TournamentRow extends Tournament {
  registered: boolean
  registering: boolean
  registeredNames: string[]
}

export default function ElternTurnierePage() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [tournaments, setTournaments] = useState<TournamentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = sessionStorage.getItem('fca_auth_player_id')
    const name = sessionStorage.getItem('fca_auth_player_name')
    if (!id || !name) {
      router.replace('/eltern')
      return
    }
    setPlayerId(id)
    setPlayerName(name)
    loadTournaments(id)
  }, [router])

  async function loadTournaments(pid: string) {
    setLoading(true)
    const today = new Date().toISOString().split('T')[0]

    const [{ data: tourData }, { data: allRegData }, { data: playersData }] = await Promise.all([
      supabase.from('tournaments').select('*').gte('date', today).order('date', { ascending: true }),
      supabase.from('tournament_registrations').select('tournament_id, player_id'),
      supabase.from('players').select('id, vorname'),
    ])

    const playerMap: Record<string, string> = {}
    for (const p of (playersData ?? [])) {
      playerMap[p.id] = p.vorname
    }

    const myRegisteredIds = new Set(
      (allRegData ?? [])
        .filter((r: { player_id: string }) => r.player_id === pid)
        .map((r: { tournament_id: string }) => r.tournament_id)
    )

    setTournaments(
      (tourData ?? []).map((t: Tournament) => {
        const regsForTournament = (allRegData ?? []).filter(
          (r: { tournament_id: string }) => r.tournament_id === t.id
        )
        const registeredNames = regsForTournament
          .map((r: { player_id: string }) => playerMap[r.player_id])
          .filter(Boolean)
          .sort()
        return {
          ...t,
          registered: myRegisteredIds.has(t.id),
          registering: false,
          registeredNames,
        }
      })
    )
    setLoading(false)
  }

  async function toggleRegistration(tournament: TournamentRow) {
    setTournaments((prev) =>
      prev.map((t) => (t.id === tournament.id ? { ...t, registering: true } : t))
    )

    if (tournament.registered) {
      await supabase
        .from('tournament_registrations')
        .delete()
        .eq('tournament_id', tournament.id)
        .eq('player_id', playerId)

      setTournaments((prev) =>
        prev.map((t) =>
          t.id === tournament.id
            ? { ...t, registered: false, registering: false, registeredNames: t.registeredNames.filter((n) => n !== playerName) }
            : t
        )
      )
    } else {
      await supabase
        .from('tournament_registrations')
        .insert({ tournament_id: tournament.id, player_id: playerId })

      setTournaments((prev) =>
        prev.map((t) =>
          t.id === tournament.id
            ? { ...t, registered: true, registering: false, registeredNames: [...t.registeredNames, playerName].sort() }
            : t
        )
      )
    }
  }

  function logout() {
    sessionStorage.removeItem('fca_auth_player_id')
    sessionStorage.removeItem('fca_auth_player_name')
    sessionStorage.removeItem('fca_player_id')
    sessionStorage.removeItem('fca_player_name')
    router.push('/')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Hallo, {playerName}!</h1>
          <p className="text-sm text-muted-foreground mt-1">Anstehende Turniere</p>
        </div>
        <button onClick={logout} className="text-xs text-muted-foreground hover:text-foreground transition-colors pt-1">
          Abmelden
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {!loading && tournaments.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">🏆</p>
          <p className="text-muted-foreground text-sm">Aktuell keine Turniere geplant.</p>
        </div>
      )}

      {!loading && tournaments.length > 0 && (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <div
              key={t.id}
              className={cn(
                'rounded-xl border px-4 py-4 transition-colors',
                t.registered ? 'border-primary/50 bg-primary/5' : 'border-border/60'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {t.category && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                        {t.category}
                      </span>
                    )}
                    <span className="text-base font-bold">{t.name}</span>
                  </div>
                  <div className="space-y-0.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span>📅</span>
                      <span>{format(new Date(t.date), 'EEEE, d. MMMM yyyy', { locale: de })}</span>
                    </div>
                    {t.time && (
                      <div className="flex items-center gap-1.5">
                        <span>🕐</span>
                        <span>{t.time.slice(0, 5)} Uhr</span>
                      </div>
                    )}
                    {t.location && (
                      <div className="flex items-center gap-1.5">
                        <span>📍</span>
                        <span>{t.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => toggleRegistration(t)}
                  disabled={t.registering}
                  className={cn(
                    'shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all active:scale-95 disabled:opacity-50',
                    t.registered
                      ? 'bg-primary/15 text-primary hover:bg-primary/25'
                      : 'bg-card border border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                  )}
                >
                  {t.registering ? '…' : t.registered ? '✓ Angemeldet' : 'Anmelden'}
                </button>
              </div>

              {t.registeredNames.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/40">
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {t.registeredNames.length} {t.registeredNames.length === 1 ? 'Kind' : 'Kinder'} angemeldet
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {t.registeredNames.map((name) => (
                      <span
                        key={name}
                        className={cn(
                          'text-xs px-2 py-1 rounded-lg font-medium',
                          name === playerName
                            ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                        )}
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
