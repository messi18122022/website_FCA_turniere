'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { Tournament } from '@/lib/types'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import GameSection, { AufgebotPlayer } from '@/components/GameSection'

interface TournamentRow extends Tournament {
  registration_count: number
  registeredNames: string[]
  aufgebotNames: string[]
  aufgebotPlayers: AufgebotPlayer[]
}

export default function TrainerTurnierePage() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<TournamentRow[]>([])
  const [playerMap, setPlayerMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionStorage.getItem('fca_trainer') !== 'true') { router.replace('/trainer'); return }
    load()
  }, [router])

  async function load() {
    setLoading(true)
    const [{ data: tourData }, { data: regData }, { data: playersData }, { data: aufgebotData }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('abgeschlossen', false).order('date', { ascending: true }),
      supabase.from('tournament_registrations').select('tournament_id, player_id'),
      supabase.from('players').select('id, vorname'),
      supabase.from('tournament_aufgebot').select('tournament_id, player_id'),
    ])

    const pm: Record<string, string> = {}
    for (const p of (playersData ?? [])) pm[p.id] = p.vorname
    setPlayerMap(pm)

    const counts: Record<string, number> = {}
    const namesByTournament: Record<string, string[]> = {}
    for (const r of (regData ?? []) as { tournament_id: string; player_id: string }[]) {
      counts[r.tournament_id] = (counts[r.tournament_id] ?? 0) + 1
      if (!namesByTournament[r.tournament_id]) namesByTournament[r.tournament_id] = []
      const name = pm[r.player_id]
      if (name) namesByTournament[r.tournament_id].push(name)
    }
    for (const tid of Object.keys(namesByTournament)) namesByTournament[tid].sort()

    const aufgebotPlayersByTournament: Record<string, AufgebotPlayer[]> = {}
    for (const a of (aufgebotData ?? []) as { tournament_id: string; player_id: string }[]) {
      if (!aufgebotPlayersByTournament[a.tournament_id]) aufgebotPlayersByTournament[a.tournament_id] = []
      const name = pm[a.player_id]
      if (name) aufgebotPlayersByTournament[a.tournament_id].push({ id: a.player_id, vorname: name })
    }
    for (const tid of Object.keys(aufgebotPlayersByTournament)) {
      aufgebotPlayersByTournament[tid].sort((a, b) => a.vorname.localeCompare(b.vorname))
    }

    setTournaments((tourData ?? []).map((t: Tournament) => ({
      ...t,
      registration_count: counts[t.id] ?? 0,
      registeredNames: namesByTournament[t.id] ?? [],
      aufgebotNames: (aufgebotPlayersByTournament[t.id] ?? []).map(p => p.vorname),
      aufgebotPlayers: aufgebotPlayersByTournament[t.id] ?? [],
    })))
    setLoading(false)
  }

  function logout() {
    sessionStorage.removeItem('fca_trainer')
    router.push('/')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Turniere</h1>
          <p className="text-sm text-muted-foreground mt-1">Anstehend</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/trainer/turnier/new" className={cn(buttonVariants(), 'rounded-xl h-10 w-10 p-0')} title="Neues Turnier">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </Link>
          <button onClick={logout} className="h-9 w-9 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center justify-center" aria-label="Abmelden">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-36 rounded-xl bg-muted animate-pulse" />)}</div>
      )}

      {!loading && tournaments.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">🏆</p>
          <p className="text-muted-foreground text-sm">Noch keine Turniere erfasst.</p>
          <Link href="/trainer/turnier/new" className={cn(buttonVariants({ variant: 'outline' }))}>Erstes Turnier erstellen</Link>
        </div>
      )}

      {!loading && tournaments.length > 0 && (
        <div className="space-y-3">
          {tournaments.map((t) => <TournamentCard key={t.id} t={t} playerMap={playerMap} />)}
        </div>
      )}
    </div>
  )
}

function TournamentCard({ t, playerMap }: { t: TournamentRow; playerMap: Record<string, string> }) {
  const [expanded, setExpanded] = useState(false)
  const hasDetails = t.registeredNames.length > 0

  const summary = [
    t.registeredNames.length > 0 && `Angemeldet: ${t.registeredNames.length}`,
    t.aufgebotNames.length > 0 && `Aufgebot: ${t.aufgebotNames.length}`,
    t.registeredNames.length > 0 && t.aufgebotNames.length === 0 && 'Noch kein Aufgebot',
  ].filter(Boolean).join(' · ')

  return (
    <div className="rounded-xl border border-border/60 px-4 py-4 transition-colors">
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
          {t.notes && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{t.notes}</p>}
        </div>
        <div className="shrink-0 flex flex-col items-stretch gap-1.5">
          <Link href={`/trainer/turnier/${t.id}/edit`} className="rounded-xl px-4 py-2 text-sm font-semibold bg-card border border-border/60 text-muted-foreground hover:border-border hover:text-foreground transition-all text-center">
            Bearbeiten
          </Link>
          {t.maps_url && (
            <a href={t.maps_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border/60 hover:border-border hover:bg-muted transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              Maps
            </a>
          )}
          {t.spielplan_url && (
            <a href={t.spielplan_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border/60 hover:border-border hover:bg-muted transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              Spielplan
            </a>
          )}
        </div>
      </div>

      {hasDetails && (
        <div className={cn('overflow-hidden transition-all duration-300 ease-in-out', expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0')}>
          {t.registeredNames.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/40">
              <p className="text-xs text-muted-foreground mb-1.5">{t.registeredNames.length} {t.registeredNames.length === 1 ? 'Kind' : 'Kinder'} angemeldet</p>
              <div className="flex flex-wrap gap-1.5">
                {t.registeredNames.map((name) => (
                  <span key={name} className="text-xs px-2 py-1 rounded-lg font-medium bg-muted text-muted-foreground">{name}</span>
                ))}
              </div>
            </div>
          )}
          {t.registeredNames.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/40 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                {t.aufgebotNames.length > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-1.5">Aufgebot: {t.aufgebotNames.length} Kinder</p>
                    <div className="flex flex-wrap gap-1.5">
                      {t.aufgebotNames.map((name) => (
                        <span key={name} className="text-xs px-2 py-1 rounded-lg font-medium bg-primary/15 text-primary">{name}</span>
                      ))}
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-muted-foreground">Noch kein Aufgebot</p>
                )}
              </div>
              <Link href={`/trainer/turnier/${t.id}/aufgebot`} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-border/60 text-muted-foreground hover:border-border hover:text-foreground hover:bg-muted/50 transition-all shrink-0">
                {t.aufgebotNames.length > 0 ? 'Bearbeiten' : 'Erstellen'}
              </Link>
            </div>
          )}
        </div>
      )}

      {hasDetails && (
        <div className="mt-3 pt-3 border-t border-border/40 flex justify-center">
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-border/60 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-border hover:bg-muted/50 transition-all duration-200 active:scale-95"
          >
            <span>{expanded ? 'Weniger' : summary}</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={cn('transition-transform duration-300', expanded && 'rotate-180')}>
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      )}

      <GameSection
        tournamentId={t.id}
        aufgebotPlayers={t.aufgebotPlayers}
        playerMap={playerMap}
        mode="trainer"
      />
    </div>
  )
}
