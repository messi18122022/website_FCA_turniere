'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'
import { supabase } from '@/lib/supabase'
import { Tournament, Player } from '@/lib/types'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function TrainerTurnierDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [registrations, setRegistrations] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [abschliessen, setAbschliessen] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('fca_trainer') !== 'true') {
      router.replace('/trainer')
      return
    }
    load()
  }, [id, router])

  async function load() {
    setLoading(true)

    const [{ data: tData }, { data: regData }] = await Promise.all([
      supabase.from('tournaments').select('*').eq('id', id).single(),
      supabase.from('tournament_registrations').select('player_id').eq('tournament_id', id),
    ])

    if (!tData) { router.replace('/trainer/turniere'); return }
    setTournament(tData)

    if (regData && regData.length > 0) {
      const playerIds = regData.map((r: { player_id: string }) => r.player_id)
      const { data: players } = await supabase
        .from('players')
        .select('id, vorname')
        .in('id', playerIds)
        .order('vorname')
      setRegistrations((players as Player[]) ?? [])
    } else {
      setRegistrations([])
    }

    setLoading(false)
  }

  async function removeRegistration(playerId: string) {
    await supabase
      .from('tournament_registrations')
      .delete()
      .eq('tournament_id', id)
      .eq('player_id', playerId)
    setRegistrations((prev) => prev.filter((p) => p.id !== playerId))
  }

  async function deleteTournament() {
    if (!confirm('Turnier und alle Anmeldungen löschen?')) return
    setDeleting(true)
    await supabase.from('tournaments').delete().eq('id', id)
    router.push('/trainer/turniere')
  }

  async function toggleAbgeschlossen() {
    if (!tournament) return
    setAbschliessen(true)
    const newVal = !tournament.abgeschlossen
    await supabase.from('tournaments').update({ abgeschlossen: newVal }).eq('id', id)
    setTournament((prev) => prev ? { ...prev, abgeschlossen: newVal } : prev)
    setAbschliessen(false)
  }

  if (loading || !tournament) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="h-4 w-32 rounded bg-muted" />
        <div className="space-y-2 mt-6">
          {[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-muted" />)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/trainer/turniere" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Turniere
        </Link>

        <div className="flex items-start justify-between gap-3 mt-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-extrabold tracking-tight">{tournament.name}</h1>
              {tournament.abgeschlossen && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  Abgeschlossen
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5 text-sm text-muted-foreground">
              <span>{format(new Date(tournament.date), 'EEEE, d. MMMM yyyy', { locale: de })}</span>
              {tournament.time && <span>{tournament.time.slice(0, 5)} Uhr</span>}
              {tournament.location && <span>{tournament.location}</span>}
              {tournament.belag && <span>{tournament.belag === 'Halle' ? '🏟 Halle' : '🌱 Rasen'}</span>}
              {tournament.modus && <span>⚽ {tournament.modus}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {!tournament.abgeschlossen && (
              <Link
                href={`/trainer/turnier/${id}/edit`}
                className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-lg h-8 px-3 text-xs')}
              >
                Bearbeiten
              </Link>
            )}
            <button
              onClick={deleteTournament}
              disabled={deleting}
              className="text-muted-foreground hover:text-destructive transition-colors p-1.5 rounded-lg hover:bg-muted"
              title="Turnier löschen"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14H6L5 6"/>
                <path d="M10 11v6M14 11v6"/>
                <path d="M9 6V4h6v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {tournament.notes && (
        <div className="rounded-xl border border-border/60 px-4 py-3 text-sm text-muted-foreground">
          {tournament.notes}
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-base">
            Anmeldungen
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {registrations.length} {registrations.length === 1 ? 'Kind' : 'Kinder'}
            </span>
          </h2>
        </div>

        {registrations.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Noch keine Anmeldungen.
          </p>
        )}

        <div className="space-y-2">
          {registrations.map((player) => (
            <div
              key={player.id}
              className="flex items-center justify-between rounded-xl border border-border/60 px-4 py-3"
            >
              <span className="text-sm font-medium">{player.vorname}</span>
              {!tournament.abgeschlossen && (
                <button
                  onClick={() => removeRegistration(player.id)}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  title="Abmelden"
                >
                  Abmelden
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Turnier abschliessen */}
      <div className="pt-2 border-t border-border/40">
        <button
          onClick={toggleAbgeschlossen}
          disabled={abschliessen}
          className={cn(
            'w-full py-3 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50',
            tournament.abgeschlossen
              ? 'border border-border/60 text-muted-foreground hover:bg-muted'
              : 'bg-muted text-foreground hover:bg-muted/80'
          )}
        >
          {abschliessen ? '…' : tournament.abgeschlossen ? 'Wieder öffnen' : 'Turnier abschliessen'}
        </button>
      </div>
    </div>
  )
}
