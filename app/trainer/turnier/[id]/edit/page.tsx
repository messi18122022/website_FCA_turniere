'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const MODUS_OPTIONS = ['4+1', '5+1', '6+1', 'Spezielles']
const BELAG_OPTIONS = ['Halle', 'Rasen'] as const

export default function EditTournamentPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', date: '', time: '', location: '', mapsUrl: '', spielplanUrl: '',
    modus: '', modusCustom: '', belag: '', notes: '',
  })

  useEffect(() => {
    if (sessionStorage.getItem('fca_trainer') !== 'true') {
      router.replace('/trainer')
      return
    }
    supabase.from('tournaments').select('*').eq('id', id).single().then(({ data }) => {
      if (!data) { router.replace('/trainer/turniere'); return }
      const isCustomModus = data.modus && !['4+1', '5+1', '6+1'].includes(data.modus)
      setForm({
        name: data.name ?? '',
        date: data.date ?? '',
        time: data.time?.slice(0, 5) ?? '',
        location: data.location ?? '',
        mapsUrl: data.maps_url ?? '',
        spielplanUrl: data.spielplan_url ?? '',
        modus: isCustomModus ? 'Spezielles' : (data.modus ?? ''),
        modusCustom: isCustomModus ? (data.modus ?? '') : '',
        belag: data.belag ?? '',
        notes: data.notes ?? '',
      })
      setLoading(false)
    })
  }, [id, router])

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.date) return
    setSaving(true)

    const modusValue = form.modus === 'Spezielles'
      ? form.modusCustom.trim() || null
      : form.modus || null

    await supabase.from('tournaments').update({
      name: form.name.trim(),
      date: form.date,
      time: form.time || null,
      location: form.location.trim() || null,
      maps_url: form.mapsUrl.trim() || null,
      spielplan_url: form.spielplanUrl.trim() || null,
      modus: modusValue,
      belag: form.belag || null,
      notes: form.notes.trim() || null,
    }).eq('id', id)

    router.push(`/trainer/turnier/${id}`)
  }

  if (loading) return (
    <div className="space-y-3 animate-pulse">
      {[1,2,3,4].map(i => <div key={i} className="h-12 rounded-xl bg-muted" />)}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href={`/trainer/turnier/${id}`} className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/60 transition-colors shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <h1 className="text-xl font-extrabold tracking-tight">Turnier bearbeiten</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="date">Datum *</Label>
            <Input id="date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time">Zeit</Label>
            <Input id="time" type="time" value={form.time} onChange={(e) => set('time', e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Ort</Label>
          <Input id="location" value={form.location} onChange={(e) => set('location', e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="mapsUrl">Maps-Link</Label>
          <Input id="mapsUrl" placeholder="https://maps.app.goo.gl/..." value={form.mapsUrl} onChange={(e) => set('mapsUrl', e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="spielplanUrl">Spielplan-Link</Label>
          <Input id="spielplanUrl" placeholder="https://..." value={form.spielplanUrl} onChange={(e) => set('spielplanUrl', e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>Modus</Label>
          <div className="flex gap-2 flex-wrap">
            {MODUS_OPTIONS.map((m) => (
              <button key={m} type="button"
                onClick={() => set('modus', form.modus === m ? '' : m)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                  form.modus === m
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >{m}</button>
            ))}
          </div>
          {form.modus === 'Spezielles' && (
            <Input placeholder="z.B. 7+1, 3+3, ..." value={form.modusCustom} onChange={(e) => set('modusCustom', e.target.value)} className="mt-2" />
          )}
        </div>

        <div className="space-y-2">
          <Label>Belag</Label>
          <div className="flex gap-2">
            {BELAG_OPTIONS.map((b) => (
              <button key={b} type="button"
                onClick={() => set('belag', form.belag === b ? '' : b)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                  form.belag === b
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >{b === 'Halle' ? '🏟 Halle' : '🌱 Rasen'}</button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notizen</Label>
          <Input id="notes" placeholder="z.B. Treffpunkt 8:30 Uhr beim Clubhaus" value={form.notes} onChange={(e) => set('notes', e.target.value)} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()} disabled={saving}>
            Abbrechen
          </Button>
          <Button type="submit" className="flex-1" disabled={saving || !form.name || !form.date}>
            {saving ? 'Speichern…' : 'Änderungen speichern'}
          </Button>
        </div>
      </form>
    </div>
  )
}
