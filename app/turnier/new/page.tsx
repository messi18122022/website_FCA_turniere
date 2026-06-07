'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const CATEGORIES = ['U7', 'U8', 'U9', 'U10', 'U11', 'U12', 'U13', 'U14']

export default function NewTournamentPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: '',
    date: '',
    location: '',
    category: '',
    notes: '',
  })

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim() || !form.date) return
    setSaving(true)

    const { data, error } = await supabase
      .from('tournaments')
      .insert({
        name: form.name.trim(),
        date: form.date,
        location: form.location.trim() || null,
        category: form.category || null,
        notes: form.notes.trim() || null,
      })
      .select()
      .single()

    if (error || !data) { setSaving(false); return }

    router.push(`/turnier/${data.id}`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Neues Turnier</h1>
        <p className="text-sm text-muted-foreground mt-1">Turnier-Details erfassen</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            placeholder="z.B. Hallencup FC Altstetten"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Datum *</Label>
          <Input
            id="date"
            type="date"
            value={form.date}
            onChange={(e) => set('date', e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Ort</Label>
          <Input
            id="location"
            placeholder="z.B. Sportanlage Heerenschürli"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Kategorie</Label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => set('category', form.category === cat ? '' : cat)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  form.category === cat
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Notizen</Label>
          <Input
            id="notes"
            placeholder="Optional..."
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={() => router.back()}
            disabled={saving}
          >
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
