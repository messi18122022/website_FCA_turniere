'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

const MODUS_OPTIONS = ['4+1', '5+1', '6+1', 'Spezielles']
const BELAG_OPTIONS = ['Halle', 'Rasen'] as const

export default function NewTournamentPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '', date: '', time: '', location: '', mapsUrl: '', spielplanUrl: '',
    modus: '', modusCustom: '', belag: '', notes: '',
  })

  useEffect(() => {
    if (sessionStorage.getItem('fca_trainer') !== 'true') {
      router.replace('/trainer')
    }
  }, [router])

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

    const { error } = await supabase.from('tournaments').insert({
      name: form.name.trim(),
      date: form.date,
      time: form.time || null,
      location: form.location.trim() || null,
      maps_url: form.mapsUrl.trim() || null,
      spielplan_url: form.spielplanUrl.trim() || null,
      modus: modusValue,
      belag: form.belag || null,
      notes: form.notes.trim() || null,
    })

    setSaving(false)
    if (!error) router.push('/trainer/turniere')
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/trainer/turniere" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
          ← Zurück
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight mt-3">Neues Turnier</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input id="name" placeholder="z.B. Hallencup FC Altstetten" value={form.name} onChange={(e) => set('name', e.target.value)} required />
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
          <Input id="location" placeholder="z.B. Sportanlage Heerenschürli" value={form.location} onChange={(e) => set('location', e.target.value)} />
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
              <button
                key={m}
                type="button"
                onClick={() => set('modus', form.modus === m ? '' : m)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                  form.modus === m
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {m}
              </button>
            ))}
          </div>
          {form.modus === 'Spezielles' && (
            <Input
              placeholder="z.B. 7+1, 3+3, ..."
              value={form.modusCustom}
              onChange={(e) => set('modusCustom', e.target.value)}
              className="mt-2"
            />
          )}
        </div>

        <div className="space-y-2">
          <Label>Belag</Label>
          <div className="flex gap-2">
            {BELAG_OPTIONS.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => set('belag', form.belag === b ? '' : b)}
                className={cn(
                  'px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors',
                  form.belag === b
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                )}
              >
                {b === 'Halle' ? '🏟 Halle' : '🌱 Rasen'}
              </button>
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
            {saving ? 'Speichern…' : 'Turnier erstellen'}
          </Button>
        </div>
      </form>
    </div>
  )
}
