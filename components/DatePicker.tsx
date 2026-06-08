'use client'

import { useState } from 'react'
import { de } from 'date-fns/locale'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  onChange: (value: string) => void
  className?: string
}

function formatDisplay(dateStr: string) {
  if (!dateStr) return 'Datum wählen'
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('de-CH', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function toDate(dateStr: string): Date | undefined {
  if (!dateStr) return undefined
  return new Date(dateStr + 'T12:00:00')
}

function toIso(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export default function DatePicker({ value, onChange, className }: Props) {
  const [open, setOpen] = useState(false)
  const [animating, setAnimating] = useState(false)

  function handleOpenChange(next: boolean) {
    if (!next) {
      setAnimating(true)
      setTimeout(() => {
        setOpen(false)
        setAnimating(false)
      }, 240)
    } else {
      setOpen(true)
    }
  }

  return (
    <Popover open={open || animating} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        className={cn(
          'w-full rounded-xl border border-input bg-card px-3.5 py-2.5 text-sm text-left font-medium transition-all duration-150',
          'hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/60',
          open && 'border-primary/40 ring-2 ring-primary/20',
          !value && 'text-muted-foreground',
          className
        )}
      >
        <span className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground shrink-0">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {formatDisplay(value)}
        </span>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 border-border/60 bg-card shadow-2xl shadow-black/40 overflow-hidden"
        align="start"
      >
        <div className={animating ? 'animate-calendar-out' : 'animate-calendar-in'}>
          <Calendar
            mode="single"
            selected={toDate(value)}
            onSelect={(date) => {
              if (date) {
                onChange(toIso(date))
                handleOpenChange(false)
              }
            }}
            locale={de}
            weekStartsOn={1}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
