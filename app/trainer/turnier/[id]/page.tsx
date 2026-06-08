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
      const { data: players } = await supabase.from('players').select('id, vorname').in('id', playerIds).order('vorname')
      setRegistrations((players as Player[]) ?? [])
    } else {
      setRegistrations([])
    }
    setLoading(false)
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
        <div className="h-10 w-10 rounded-xl bg-muted" />
        <div className="h-8 w-48 rounded bg-muted" />
        <div className="space-y-2 mt-6">{[1,2,3].map(i => <div key={i} className="h-12 rounded-xl bg-muted" />)}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/trainer/turniere"
          className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/60 transition-colors shrink-0 mt-0.5"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold tracking-tight">{tournament.name}</h1>
            {tournament.abgeschlossen && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted text-muted-foreground">Abgeschlossen</span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-sm text-muted-foreground">
            <span>{format(new Date(tournament.date), 'EEEE, d. MMMM yyyy', { locale: de })}</span>
            {tournament.time && <span>{tournament.time.slice(0, 5)} Uhr</span>}
            {tournament.location && <span>{tournament.location}</span>}
            {tournament.belag && <span>{tournament.belag === 'Halle' ? '🏟 Halle' : '🌱 Rasen'}</span>}
            {tournament.modus && <span>⚽ {tournament.modus}</span>}
          </div>
        </div>
        {!tournament.abgeschlossen && (
          <Link
            href={`/trainer/turnier/${id}/edit`}
            className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'rounded-lg h-8 px-3 text-xs shrink-0 mt-1')}
          >
            Bearbeiten
          </Link>
        )}
      </div>

      {tournament.notes && (
        <div className="rounded-xl border border-border/60 px-4 py-3 text-sm text-muted-foreground">
          {tournament.notes}
        </div>
      )}

      {/* Anmeldungen */}
      <div className="space-y-3">
        <h2 className="font-bold text-base">
          Anmeldungen
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {registrations.length} {registrations.length === 1 ? 'Kind' : 'Kinder'}
          </span>
        </h2>

        {registrations.length === 0 && (
          <p className="text-sm text-muted-foreground py-6 text-center">Noch keine Anmeldungen.</p>
        )}

        <div className="space-y-2">
          {registrations.map((player) => (
            <div key={player.id} className="rounded-xl border border-border/60 px-4 py-3">
              <span className="text-sm font-medium">{player.vorname}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Aktionen */}
      <div className="flex items-center gap-3 pt-2 border-t border-border/40">
        <button
          onClick={deleteTournament}
          disabled={deleting}
          title="Turnier löschen"
          className="h-12 w-12 rounded-xl bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors disabled:opacity-50 shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
            <path d="M10 11v6"/><path d="M14 11v6"/>
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
          </svg>
        </button>
        <button
          onClick={toggleAbgeschlossen}
          disabled={abschliessen}
          className="flex-1 py-3 rounded-xl text-sm font-semibold border border-border/60 text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          {abschliessen ? '…' : tournament.abgeschlossen ? 'Wieder öffnen' : 'Turnier abschliessen'}
        </button>
      </div>
    </div>
  )
}
