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
        <div className="space-y-2">{[1,2,3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
      )}

      {!loading && tournaments.length === 0 && (
        <div className="text-center py-16 space-y-2">
          <p className="text-4xl">✅</p>
          <p className="text-muted-foreground text-sm">Noch keine abgeschlossenen Turniere.</p>
        </div>
      )}

      {!loading && tournaments.length > 0 && (
        <div className="space-y-2">
          {tournaments.map((t) => (
            <Link key={t.id} href={`/trainer/turnier/${t.id}`} className="flex items-center justify-between gap-3 rounded-xl border border-border/40 px-4 py-3.5 hover:border-border transition-colors opacity-70">
              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-sm font-semibold truncate block">{t.name}</span>
                <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                  <span>{format(new Date(t.date), 'd. MMM yyyy', { locale: de })}</span>
                  {t.time && <span>{t.time.slice(0, 5)} Uhr</span>}
                  {t.location && <span className="truncate">{t.location}</span>}
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span className={cn('text-sm font-bold', t.registration_count > 0 ? 'text-primary' : 'text-muted-foreground')}>{t.registration_count}</span>
                <div className="text-[10px] text-muted-foreground">Anmeld.</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
