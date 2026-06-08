'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Tournament } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PlayerRow {
  id: string
  vorname: string
  allTimePercent: number | null
  weekAttended: number
  totalWeekSessions: number
  selected: boolean
}

export default function AufgebotPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [tournament, setTournament] = useState<Tournament | null>(null)
  const [players, setPlayers] = useState<PlayerRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem('fca_trainer') !== 'true') {
      router.replace('/trainer')
      return
    }
    load()
  }, [id, router])

  async function load() {
    setLoading(true)

    const { data: tData } = await supabase.from('tournaments').select('*').eq('id', id).single()
    if (!tData) { router.replace('/trainer/turniere'); return }
    setTournament(tData)

    const { data: regData } = await supabase
      .from('tournament_registrations').select('player_id').eq('tournament_id', id)

    if (!regData || regData.length === 0) {
      setPlayers([])
      setLoading(false)
      return
    }

    const playerIds = regData.map((r: { player_id: string }) => r.player_id)

    // Woche vor dem Turnier
    const tDate = new Date(tData.date + 'T12:00:00')
    const weekEnd = new Date(tDate)
    weekEnd.setDate(weekEnd.getDate() - 1)
    const weekStart = new Date(tDate)
    weekStart.setDate(weekStart.getDate() - 7)
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    const [
      { data: playersData },
      { data: weekSessionsData },
      { data: allAttendance },
      { data: aufgebotData },
    ] = await Promise.all([
      supabase.from('players').select('id, vorname').in('id', playerIds).order('vorname'),
      supabase.from('sessions').select('id').gte('date', weekStartStr).lte('date', weekEndStr),
      supabase.from('attendance').select('player_id, present, session_id').in('player_id', playerIds),
      supabase.from('tournament_aufgebot').select('player_id').eq('tournament_id', id),
    ])

    const weekSessionIds = new Set((weekSessionsData ?? []).map((s: { id: string }) => s.id))
    const aufgebotIds = new Set((aufgebotData ?? []).map((a: { player_id: string }) => a.player_id))
    const hasExisting = aufgebotIds.size > 0

    const allTimeMap: Record<string, { present: number; total: number }> = {}
    const weekMap: Record<string, number> = {}

    for (const a of (allAttendance ?? []) as { player_id: string; present: boolean; session_id: string }[]) {
      if (!allTimeMap[a.player_id]) allTimeMap[a.player_id] = { present: 0, total: 0 }
      allTimeMap[a.player_id].total++
      if (a.present) allTimeMap[a.player_id].present++
      if (weekSessionIds.has(a.session_id) && a.present) {
        weekMap[a.player_id] = (weekMap[a.player_id] ?? 0) + 1
      }
    }

    setPlayers((playersData ?? []).map((p: { id: string; vorname: string }) => {
      const att = allTimeMap[p.id]
      return {
        id: p.id,
        vorname: p.vorname,
        allTimePercent: att && att.total > 0 ? Math.round((att.present / att.total) * 100) : null,
        weekAttended: weekMap[p.id] ?? 0,
        totalWeekSessions: weekSessionIds.size,
        selected: hasExisting ? aufgebotIds.has(p.id) : true,
      }
    }))
    setLoading(false)
  }

  function toggle(playerId: string) {
    setPlayers(prev => prev.map(p => p.id === playerId ? { ...p, selected: !p.selected } : p))
  }

  async function save() {
    setSaving(true)
    await supabase.from('tournament_aufgebot').delete().eq('tournament_id', id)
    const selected = players.filter(p => p.selected)
    if (selected.length > 0) {
      await supabase.from('tournament_aufgebot').insert(
        selected.map(p => ({ tournament_id: id, player_id: p.id }))
      )
    }
    router.push('/trainer/turniere')
  }

  const selectedCount = players.filter(p => p.selected).length
  const hasWeekData = players.some(p => p.totalWeekSessions > 0)

  if (loading) return (
    <div className="space-y-3 animate-pulse">
      {[1,2,3,4,5].map(i => <div key={i} className="h-16 rounded-xl bg-muted" />)}
    </div>
  )

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/trainer/turniere" className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/60 transition-colors shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <div>
          <h1 className="text-xl font-extrabold tracking-tight">Aufgebot</h1>
          <p className="text-sm text-muted-foreground">{tournament?.name}</p>
        </div>
      </div>

      {hasWeekData && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Kein Training diese Woche</span>
          <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> 1× Training diese Woche</span>
        </div>
      )}

      {players.length === 0 && (
        <p className="text-muted-foreground text-sm text-center py-10">Noch keine Anmeldungen.</p>
      )}

      <div className="space-y-2">
        {players.map(p => {
          const weekStyle = p.totalWeekSessions === 0 ? '' :
            p.weekAttended === 0 ? 'bg-red-500/8 border-red-400/40' :
            p.weekAttended === 1 ? 'bg-yellow-400/10 border-yellow-400/40' : ''

          return (
            <button
              key={p.id}
              onClick={() => toggle(p.id)}
              className={cn(
                'w-full flex items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all active:scale-[0.99]',
                p.selected
                  ? cn(weekStyle || 'border-primary/40 bg-primary/5')
                  : 'border-border/40 opacity-40'
              )}
            >
              <div className={cn(
                'h-5 w-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
                p.selected ? 'bg-primary border-primary' : 'border-border'
              )}>
                {p.selected && (
                  <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>

              <span className="flex-1 text-sm font-medium">{p.vorname}</span>

              <span className="text-xs text-muted-foreground w-8 text-right">
                {p.allTimePercent !== null ? `${p.allTimePercent}%` : '—'}
              </span>

              {p.totalWeekSessions > 0 && (
                <span className={cn(
                  'text-xs font-bold w-8 text-right',
                  p.weekAttended === 0 ? 'text-red-500' :
                  p.weekAttended === 1 ? 'text-yellow-500' :
                  'text-green-600'
                )}>
                  {p.weekAttended}/{p.totalWeekSessions}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {players.length > 0 && (
        <button
          onClick={save}
          disabled={saving}
          className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {saving ? '…' : `${selectedCount} ${selectedCount === 1 ? 'Kind' : 'Kinder'} aufbieten`}
        </button>
      )}
    </div>
  )
}
