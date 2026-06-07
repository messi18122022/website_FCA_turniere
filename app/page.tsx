'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Tournament, TournamentGame, TournamentWithStats } from '@/lib/types'
import { buttonVariants } from '@/components/ui/button'
import TournamentCard from '@/components/TournamentCard'
import { cn } from '@/lib/utils'

function CardSkeleton() {
  return (
    <div className="rounded-xl border border-border/60 px-4 py-3.5 animate-pulse">
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-5 w-12 rounded-full bg-muted" />
            <div className="h-4 w-32 rounded bg-muted" />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-3 w-24 rounded bg-muted" />
            <div className="h-3 w-16 rounded bg-muted" />
          </div>
        </div>
        <div className="space-y-1">
          <div className="h-4 w-20 rounded bg-muted" />
          <div className="h-3 w-12 rounded bg-muted" />
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [tournaments, setTournaments] = useState<TournamentWithStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    load()
    const onVisible = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [])

  async function load() {
    setLoading(true)

    const { data: tourData } = await supabase
      .from('tournaments')
      .select('*')
      .order('date', { ascending: false })

    if (!tourData) { setLoading(false); return }

    const { data: gamesData } = await supabase
      .from('tournament_games')
      .select('tournament_id, goals_for, goals_against')

    const { data: squadData } = await supabase
      .from('tournament_squad')
      .select('tournament_id, player_id')

    const enriched: TournamentWithStats[] = (tourData as Tournament[]).map((t) => {
      const games = (gamesData ?? []).filter((g: Pick<TournamentGame, 'tournament_id' | 'goals_for' | 'goals_against'>) => g.tournament_id === t.id)
      const wins = games.filter((g) => g.goals_for > g.goals_against).length
      const draws = games.filter((g) => g.goals_for === g.goals_against).length
      const losses = games.filter((g) => g.goals_for < g.goals_against).length
      const goals_for = games.reduce((s, g) => s + g.goals_for, 0)
      const goals_against = games.reduce((s, g) => s + g.goals_against, 0)
      const squad_count = (squadData ?? []).filter((s: { tournament_id: string; player_id: string }) => s.tournament_id === t.id).length

      return { ...t, game_count: games.length, wins, draws, losses, goals_for, goals_against, squad_count }
    })

    setTournaments(enriched)
    setLoading(false)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight">Turniere</h1>
        <Link
          href="/turnier/new"
          className={cn(buttonVariants(), 'rounded-xl h-10 w-10 p-0')}
          title="Neues Turnier"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </Link>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <CardSkeleton key={i} />)}
        </div>
      )}

      {!loading && tournaments.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">🏆</p>
          <p className="text-muted-foreground text-sm">Noch keine Turniere erfasst.</p>
          <Link href="/turnier/new" className={cn(buttonVariants({ variant: 'outline' }))}>
            Erstes Turnier erstellen
          </Link>
        </div>
      )}

      {!loading && tournaments.length > 0 && (
        <div className="space-y-3">
          {tournaments.map((t) => (
            <TournamentCard key={t.id} tournament={t} />
          ))}
        </div>
      )}
    </div>
  )
}
