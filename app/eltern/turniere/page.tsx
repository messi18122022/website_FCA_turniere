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

type Tab = 'anstehend' | 'abgeschlossen'

function LogoutButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="h-9 w-9 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center justify-center shrink-0"
      aria-label="Abmelden"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    </button>
  )
}

export default function ElternTurnierePage() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [tournaments, setTournaments] = useState<TournamentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('anstehend')

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

    const [{ data: tourData }, { data: allRegData }, { data: playersData }] = await Promise.all([
      supabase.from('tournaments').select('*').order('date', { ascending: true }),
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

  const anstehend = tournaments.filter((t) => !t.abgeschlossen)
  const abgeschlossen = tournaments.filter((t) => t.abgeschlossen)
  const visible = activeTab === 'anstehend' ? anstehend : abgeschlossen

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{playerName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Turniere</p>
        </div>
        <LogoutButton onClick={logout} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted">
        <button
          onClick={() => setActiveTab('anstehend')}
          className={cn(
            'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
            activeTab === 'anstehend'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Anstehend
          {!loading && anstehend.length > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">({anstehend.length})</span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('abgeschlossen')}
          className={cn(
            'flex-1 py-2 text-sm font-medium rounded-lg transition-colors',
            activeTab === 'abgeschlossen'
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          Abgeschlossen
          {!loading && abgeschlossen.length > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">({abgeschlossen.length})</span>
          )}
        </button>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {!loading && visible.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">🏆</p>
          <p className="text-muted-foreground text-sm">
            {activeTab === 'anstehend' ? 'Aktuell keine Turniere geplant.' : 'Noch keine abgeschlossenen Turniere.'}
          </p>
        </div>
      )}

      {!loading && visible.length > 0 && (
        <div className="space-y-3">
          {visible.map((t) => (
            <div
              key={t.id}
              className={cn(
                'rounded-xl border px-4 py-4 transition-colors',
                t.registered ? 'border-primary/50 bg-primary/5' : 'border-border/60',
                t.abgeschlossen && 'opacity-70'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <span className="text-base font-bold">{t.name}</span>
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
                    {t.belag && (
                      <div className="flex items-center gap-1.5">
                        <span>{t.belag === 'Halle' ? '🏟' : '🌱'}</span>
                        <span>{t.belag}</span>
                      </div>
                    )}
                    {t.modus && (
                      <div className="flex items-center gap-1.5">
                        <span>⚽</span>
                        <span>{t.modus}</span>
                      </div>
                    )}
                  </div>
                  {t.notes && (
                    <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{t.notes}</p>
                  )}
                  {(t.maps_url || t.spielplan_url) && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {t.maps_url && (
                        <a href={t.maps_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border/60 hover:border-border hover:bg-muted transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                            <circle cx="12" cy="10" r="3"/>
                          </svg>
                          Maps
                        </a>
                      )}
                      {t.spielplan_url && (
                        <a href={t.spielplan_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border/60 hover:border-border hover:bg-muted transition-colors"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                          </svg>
                          Spielplan
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {!t.abgeschlossen && (
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
                )}

                {t.abgeschlossen && t.registered && (
                  <span className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold bg-primary/15 text-primary">
                    ✓ Angemeldet
                  </span>
                )}
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
