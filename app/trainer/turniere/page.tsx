'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { Tournament, TournamentWithCount } from '@/lib/types'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type Tab = 'anstehend' | 'abgeschlossen'

export default function TrainerTurnierePage() {
  const router = useRouter()
  const [tournaments, setTournaments] = useState<TournamentWithCount[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('anstehend')

  useEffect(() => {
    if (sessionStorage.getItem('fca_trainer') !== 'true') {
      router.replace('/trainer')
      return
    }
    load()
  }, [router])

  async function load() {
    setLoading(true)
    const [{ data: tourData }, { data: regData }] = await Promise.all([
      supabase.from('tournaments').select('*').order('date', { ascending: true }),
      supabase.from('tournament_registrations').select('tournament_id'),
    ])

    const counts: Record<string, number> = {}
    for (const r of (regData ?? []) as { tournament_id: string }[]) {
      counts[r.tournament_id] = (counts[r.tournament_id] ?? 0) + 1
    }

    setTournaments(
      (tourData ?? []).map((t: Tournament) => ({
        ...t,
        registration_count: counts[t.id] ?? 0,
      }))
    )
    setLoading(false)
  }

  function logout() {
    sessionStorage.removeItem('fca_trainer')
    router.push('/')
  }

  const anstehend = tournaments.filter((t) => !t.abgeschlossen)
  const abgeschlossen = tournaments.filter((t) => t.abgeschlossen)
  const visible = activeTab === 'anstehend' ? anstehend : abgeschlossen

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Turniere</h1>
          <p className="text-sm text-muted-foreground mt-1">Trainer-Ansicht</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/trainer/turnier/new"
            className={cn(buttonVariants(), 'rounded-xl h-10 w-10 p-0')}
            title="Neues Turnier"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </Link>
          <button
            onClick={logout}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Abmelden
          </button>
        </div>
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
          {anstehend.length > 0 && (
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
          {abgeschlossen.length > 0 && (
            <span className="ml-1.5 text-xs text-muted-foreground">({abgeschlossen.length})</span>
          )}
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1,2,3].map((i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
        </div>
      )}

      {!loading && (
        <>
          {visible.length > 0 && (
            <div className="space-y-2">
              {visible.map((t) => (
                <TournamentItem key={t.id} t={t} faded={activeTab === 'abgeschlossen'} />
              ))}
            </div>
          )}

          {visible.length === 0 && activeTab === 'anstehend' && (
            <div className="text-center py-16 space-y-2">
              <p className="text-4xl">🏆</p>
              <p className="text-muted-foreground text-sm">Noch keine Turniere erfasst.</p>
              <Link href="/trainer/turnier/new" className={cn(buttonVariants({ variant: 'outline' }))}>
                Erstes Turnier erstellen
              </Link>
            </div>
          )}

          {visible.length === 0 && activeTab === 'abgeschlossen' && (
            <div className="text-center py-16 space-y-2">
              <p className="text-4xl">✅</p>
              <p className="text-muted-foreground text-sm">Noch keine abgeschlossenen Turniere.</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function TournamentItem({ t, faded }: { t: TournamentWithCount; faded?: boolean }) {
  return (
    <Link
      href={`/trainer/turnier/${t.id}`}
      className={cn(
        'flex items-center justify-between gap-3 rounded-xl border px-4 py-3.5 hover:border-border transition-colors',
        faded ? 'border-border/40 opacity-60' : 'border-border/60'
      )}
    >
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold truncate">{t.name}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
          <span>{format(new Date(t.date), 'd. MMM yyyy', { locale: de })}</span>
          {t.time && <span>{t.time.slice(0, 5)} Uhr</span>}
          {t.location && <span className="truncate">{t.location}</span>}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <span className={cn(
          'text-sm font-bold',
          t.registration_count > 0 ? 'text-primary' : 'text-muted-foreground'
        )}>
          {t.registration_count}
        </span>
        <div className="text-[10px] text-muted-foreground">Anmeld.</div>
      </div>
    </Link>
  )
}
