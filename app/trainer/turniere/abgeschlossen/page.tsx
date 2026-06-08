'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { Tournament, TournamentWithCount } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function TrainerAbgeschlossenPage() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<TournamentWithCount[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (sessionStorage.getItem('fca_trainer') !== 'true') { router.replace('/trainer'); return }
    load()
  }, [router])

  async function load() {
    setLoading(true)
    const [{ data: tourData }, { data: regData }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('abgeschlossen', true).order('date', { ascending: false }),
      supabase.from('tournament_registrations').select('tournament_id'),
    ])
    const counts: Record<string, number> = {}
    for (const r of (regData ?? []) as { tournament_id: string }[]) {
      counts[r.tournament_id] = (counts[r.tournament_id] ?? 0) + 1
    }
    setTournaments((tourData ?? []).map((t: Tournament) => ({ ...t, registration_count: counts[t.id] ?? 0 })))
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
          <p className="text-sm text-muted-foreground mt-1">Abgeschlossen</p>
        </div>
        <button
          onClick={logout}
          className="h-9 w-9 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors flex items-center justify-center"
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
        <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />)}</div>
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
            <div key={t.id} className="rounded-xl border border-border/40 px-4 py-4 opacity-70">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-bold">{t.name}</span>
                    {t.registration_count > 0 && (
                      <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md font-medium">
                        {t.registration_count} Anmeld.
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <span>📅</span>
                      <span>{format(new Date(t.date), 'EEEE, d. MMMM yyyy', { locale: de })}</span>
                    </div>
                    {t.time && <div className="flex items-center gap-1.5"><span>🕐</span><span>{t.time.slice(0, 5)} Uhr</span></div>}
                    {t.location && <div className="flex items-center gap-1.5"><span>📍</span><span>{t.location}</span></div>}
                    {t.belag && <div className="flex items-center gap-1.5"><span>{t.belag === 'Halle' ? '🏟' : '🌱'}</span><span>{t.belag}</span></div>}
                    {t.modus && <div className="flex items-center gap-1.5"><span>⚽</span><span>{t.modus}</span></div>}
                  </div>
                  {t.notes && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{t.notes}</p>}
                </div>
                <Link
                  href={`/trainer/turnier/${t.id}`}
                  className="shrink-0 rounded-xl px-4 py-2 text-sm font-semibold bg-card border border-border/60 text-muted-foreground hover:border-border hover:text-foreground transition-all"
                >
                  Bearbeiten
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
