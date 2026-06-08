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

interface TournamentRow extends Tournament {
  registration_count: number
  registeredNames: string[]
}

export default function TrainerTurnierePage() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<TournamentRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionStorage.getItem('fca_trainer') !== 'true') { router.replace('/trainer'); return }
    load()
  }, [router])

  async function load() {
    setLoading(true)
    const [{ data: tourData }, { data: regData }, { data: playersData }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('abgeschlossen', false).order('date', { ascending: true }),
      supabase.from('tournament_registrations').select('tournament_id, player_id'),
      supabase.from('players').select('id, vorname'),
    ])
    const playerMap: Record<string, string> = {}
    for (const p of (playersData ?? [])) playerMap[p.id] = p.vorname

    const counts: Record<string, number> = {}
    const namesByTournament: Record<string, string[]> = {}
    for (const r of (regData ?? []) as { tournament_id: string; player_id: string }[]) {
      counts[r.tournament_id] = (counts[r.tournament_id] ?? 0) + 1
      if (!namesByTournament[r.tournament_id]) namesByTournament[r.tournament_id] = []
      const name = playerMap[r.player_id]
      if (name) namesByTournament[r.tournament_id].push(name)
    }
    for (const tid of Object.keys(namesByTournament)) namesByTournament[tid].sort()

    setTournaments((tourData ?? []).map((t: Tournament) => ({
      ...t,
      registration_count: counts[t.id] ?? 0,
      registeredNames: namesByTournament[t.id] ?? [],
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
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>
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
          {tournaments.map((t) => <TournamentCard key={t.id} t={t} />)}
        </div>
      )}
    </div>
  )
}

function TournamentCard({ t, faded }: { t: TournamentRow; faded?: boolean }) {
  return (
    <div className={cn('rounded-xl border px-4 py-4 transition-colors', faded ? 'border-border/40 opacity-70' : 'border-border/60')}>
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
          {(t.maps_url || t.spielplan_url) && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {t.maps_url && (
                <a href={t.maps_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border/60 hover:border-border hover:bg-muted transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  Maps
                </a>
              )}
              {t.spielplan_url && (
                <a href={t.spielplan_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border/60 hover:border-border hover:bg-muted transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  Spielplan
                </a>
              )}
            </div>
          )}
        </div>
        <Link href={`/trainer/turnier/${t.id}/edit`} className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold bg-card border border-border/60 text-muted-foreground hover:border-border hover:text-foreground transition-all">
          Bearbeiten
        </Link>
      </div>

      {t.registeredNames.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border/40">
          <p className="text-xs text-muted-foreground mb-1.5">
            {t.registeredNames.length} {t.registeredNames.length === 1 ? 'Kind' : 'Kinder'} angemeldet
          </p>
          <div className="flex flex-wrap gap-1.5">
            {t.registeredNames.map((name) => (
              <span key={name} className="text-xs px-2 py-1 rounded-lg font-medium bg-muted text-muted-foreground">{name}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
