'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { Tournament } from '@/lib/types'
import { cn } from '@/lib/utils'
import GameSection from '@/components/GameSection'

interface TournamentRow extends Tournament {
  registered: boolean
  registeredNames: string[]
  aufgeboten: boolean
  aufgebotNames: string[]
}

export default function ElternAbgeschlossenPage() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [tournaments, setTournaments] = useState<TournamentRow[]>([])
  const [playerMap, setPlayerMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const id = sessionStorage.getItem('fca_auth_player_id')
    const name = sessionStorage.getItem('fca_auth_player_name')
    if (!id || !name) { router.replace('/eltern'); return }
    setPlayerId(id)
    setPlayerName(name)
    loadTournaments(id)
  }, [router])

  async function loadTournaments(pid: string) {
    setLoading(true)
    const [{ data: tourData }, { data: allRegData }, { data: playersData }, { data: aufgebotData }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('abgeschlossen', true).order('date', { ascending: false }),
      supabase.from('tournament_registrations').select('tournament_id, player_id'),
      supabase.from('players').select('id, vorname'),
      supabase.from('tournament_aufgebot').select('tournament_id, player_id'),
    ])
    const pm: Record<string, string> = {}
    for (const p of (playersData ?? [])) pm[p.id] = p.vorname
    setPlayerMap(pm)

    const myRegisteredIds = new Set(
      (allRegData ?? []).filter((r: { player_id: string }) => r.player_id === pid).map((r: { tournament_id: string }) => r.tournament_id)
    )
    const myAufgebotIds = new Set(
      (aufgebotData ?? []).filter((a: { player_id: string }) => a.player_id === pid).map((a: { tournament_id: string }) => a.tournament_id)
    )
    const aufgebotByTournament: Record<string, string[]> = {}
    for (const a of (aufgebotData ?? []) as { tournament_id: string; player_id: string }[]) {
      if (!aufgebotByTournament[a.tournament_id]) aufgebotByTournament[a.tournament_id] = []
      const name = pm[a.player_id]
      if (name) aufgebotByTournament[a.tournament_id].push(name)
    }
    for (const tid of Object.keys(aufgebotByTournament)) aufgebotByTournament[tid].sort()

    setTournaments(
      (tourData ?? []).map((t: Tournament) => {
        const regsForTournament = (allRegData ?? []).filter((r: { tournament_id: string }) => r.tournament_id === t.id)
        return {
          ...t,
          registered: myRegisteredIds.has(t.id),
          registeredNames: regsForTournament.map((r: { player_id: string }) => pm[r.player_id]).filter(Boolean).sort(),
          aufgeboten: myAufgebotIds.has(t.id),
          aufgebotNames: aufgebotByTournament[t.id] ?? [],
        }
      })
    )
    setLoading(false)
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{playerName}</h1>
          <p className="text-sm text-muted-foreground mt-1">Abgeschlossene Turniere</p>
        </div>
        <button
          onClick={logout}
          className="h-9 w-9 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center justify-center shrink-0"
          aria-label="Abmelden"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      {loading && (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
      )}

      {!loading && tournaments.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">✅</p>
          <p className="text-muted-foreground text-sm">Noch keine abgeschlossenen Turniere.</p>
        </div>
      )}

      {!loading && tournaments.length > 0 && (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <AbgeschlossenCard key={t.id} t={t} playerName={playerName} playerMap={playerMap} />
          ))}
        </div>
      )}
    </div>
  )
}

function AbgeschlossenCard({ t, playerName, playerMap }: { t: TournamentRow; playerName: string; playerMap: Record<string, string> }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className={cn('rounded-xl border px-4 py-4', t.registered ? 'border-primary/50 bg-primary/5' : 'border-border/60')}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0 space-y-1.5">
          <span className="text-base font-bold">{t.name}</span>
          <div className="space-y-0.5 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5"><span>📅</span><span>{format(new Date(t.date), 'EEEE, d. MMMM yyyy', { locale: de })}</span></div>
            {t.time && <div className="flex items-center gap-1.5"><span>🕐</span><span>{t.time.slice(0, 5)} Uhr</span></div>}
            {t.location && <div className="flex items-center gap-1.5"><span>📍</span><span>{t.location}</span></div>}
            {t.belag && <div className="flex items-center gap-1.5"><span>{t.belag === 'Halle' ? '🏟' : '🌱'}</span><span>{t.belag}</span></div>}
            {t.modus && <div className="flex items-center gap-1.5"><span>⚽</span><span>{t.modus}</span></div>}
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          {t.rang != null && t.total_teams != null && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-primary/15 text-primary">
              {t.rang}/{t.total_teams}
            </span>
          )}
          {t.aufgeboten && (
            <span className="rounded-xl px-4 py-2 text-sm font-semibold bg-green-500/10 text-green-600">✓ Aufgeboten</span>
          )}
          {t.registered && !t.aufgeboten && (
            <span className="rounded-xl px-4 py-2 text-sm font-semibold bg-primary/15 text-primary">✓ Angemeldet</span>
          )}
        </div>
      </div>

      <div className={cn('overflow-hidden transition-all duration-300 ease-in-out', expanded ? 'max-h-[900px] opacity-100' : 'max-h-0 opacity-0')}>
        {t.registeredNames.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <p className="text-xs text-muted-foreground mb-1.5">{t.registeredNames.length} {t.registeredNames.length === 1 ? 'Kind' : 'Kinder'} angemeldet</p>
            <div className="flex flex-wrap gap-1.5">
              {t.registeredNames.map((name) => (
                <span key={name} className={cn('text-xs px-2 py-1 rounded-lg font-medium', name === playerName ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground')}>{name}</span>
              ))}
            </div>
          </div>
        )}
        {t.aufgebotNames.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/40">
            <p className="text-xs text-muted-foreground mb-1.5">Aufgebot: {t.aufgebotNames.length} {t.aufgebotNames.length === 1 ? 'Kind' : 'Kinder'}</p>
            <div className="flex flex-wrap gap-1.5">
              {t.aufgebotNames.map((name) => (
                <span key={name} className={cn('text-xs px-2 py-1 rounded-lg font-medium', name === playerName ? 'bg-green-500/20 text-green-600' : 'bg-primary/15 text-primary')}>{name}</span>
              ))}
            </div>
          </div>
        )}
        <GameSection
          tournamentId={t.id}
          aufgebotPlayers={[]}
          playerMap={playerMap}
          mode="read"
        />
      </div>

      <div className="mt-3 pt-3 border-t border-border/40 flex justify-center">
        <button
          onClick={() => setExpanded(e => !e)}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/50 transition-all duration-200 active:scale-95"
        >
          <span>{expanded ? 'Weniger anzeigen' : 'Mehr anzeigen'}</span>
          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn('transition-transform duration-300', expanded && 'rotate-180')}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
