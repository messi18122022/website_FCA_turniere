'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { TournamentWithStats } from '@/lib/types'

interface Props {
  tournament: TournamentWithStats
}

export default function TournamentCard({ tournament: t }: Props) {
  const hasGames = t.game_count > 0
  const record = hasGames ? `${t.wins}S ${t.draws}U ${t.losses}N` : null

  return (
    <Link
      href={`/turnier/${t.id}`}
      className="block rounded-xl border border-border/60 px-4 py-3.5 hover:border-border transition-colors active:bg-muted/40"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {t.category && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary shrink-0">
                {t.category}
              </span>
            )}
            <span className="text-sm font-semibold truncate">{t.name}</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{format(new Date(t.date), 'd. MMM yyyy', { locale: de })}</span>
            {t.location && <span className="truncate">{t.location}</span>}
          </div>
        </div>

        <div className="flex flex-col items-end gap-1 shrink-0">
          {hasGames ? (
            <>
              <span className={cn(
                'text-xs font-bold',
                t.wins > t.losses ? 'text-primary' : t.losses > t.wins ? 'text-destructive' : 'text-muted-foreground'
              )}>
                {record}
              </span>
              <span className="text-xs text-muted-foreground">
                {t.goals_for}:{t.goals_against}
              </span>
            </>
          ) : (
            <span className="text-xs text-muted-foreground">{t.squad_count} Spieler</span>
          )}
        </div>
      </div>
    </Link>
  )
}
