'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface NumpadProps {
  mode: 'date' | 'pin'
  onComplete: (value: string) => void
  title: string
  subtitle?: string
  error?: string | null
  loading?: boolean
}

export default function Numpad({ mode, onComplete, title, subtitle, error, loading }: NumpadProps) {
  const [digits, setDigits] = useState('')
  const maxLen = mode === 'date' ? 8 : 4

  function addDigit(d: string) {
    if (digits.length >= maxLen || loading) return
    setDigits((prev) => prev + d)
  }

  function backspace() {
    if (loading) return
    setDigits((prev) => prev.slice(0, -1))
  }

  function confirm() {
    if (digits.length === maxLen && !loading) onComplete(digits)
  }

  function renderDisplay() {
    if (mode === 'date') {
      const d = digits.padEnd(8, ' ')
      const chars = [d[0], d[1], '.', d[2], d[3], '.', d[4], d[5], d[6], d[7]]
      return (
        <div className="flex items-center justify-center gap-0.5 h-12">
          {chars.map((c, i) =>
            c === '.' ? (
              <span key={i} className="text-3xl font-bold text-muted-foreground mx-0.5">.</span>
            ) : (
              <span key={i} className={cn(
                'text-3xl font-bold font-mono w-7 text-center',
                c === ' ' ? 'text-border' : 'text-foreground'
              )}>
                {c === ' ' ? '_' : c}
              </span>
            )
          )}
        </div>
      )
    }

    return (
      <div className="flex items-center justify-center gap-5 h-12">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={cn(
            'w-4 h-4 rounded-full border-2 transition-all duration-150',
            i < digits.length ? 'bg-primary border-primary scale-110' : 'border-muted-foreground/40'
          )} />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1.5">{subtitle}</p>}
      </div>

      <div className={cn(
        'rounded-2xl border px-6 py-5 text-center transition-colors',
        error ? 'border-destructive/60 bg-destructive/5' : 'border-border/60 bg-card'
      )}>
        {renderDisplay()}
        <p className={cn(
          'text-xs mt-3 h-4 transition-opacity',
          error ? 'text-destructive opacity-100' : 'opacity-0'
        )}>
          {error ?? ' '}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {['1','2','3','4','5','6','7','8','9'].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => addDigit(d)}
            disabled={digits.length >= maxLen || !!loading}
            className="h-16 rounded-2xl border border-border/60 bg-card text-xl font-bold hover:bg-muted hover:border-border active:scale-95 transition-all disabled:opacity-30 select-none"
          >
            {d}
          </button>
        ))}

        <button
          type="button"
          onClick={backspace}
          disabled={digits.length === 0 || !!loading}
          className="h-16 rounded-2xl border border-border/60 bg-card flex items-center justify-center hover:bg-muted hover:border-border active:scale-95 transition-all disabled:opacity-30 select-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/>
            <line x1="18" y1="9" x2="12" y2="15"/>
            <line x1="12" y1="9" x2="18" y2="15"/>
          </svg>
        </button>

        <button
          type="button"
          onClick={() => addDigit('0')}
          disabled={digits.length >= maxLen || !!loading}
          className="h-16 rounded-2xl border border-border/60 bg-card text-xl font-bold hover:bg-muted hover:border-border active:scale-95 transition-all disabled:opacity-30 select-none"
        >
          0
        </button>

        <button
          type="button"
          onClick={confirm}
          disabled={digits.length < maxLen || !!loading}
          className="h-16 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:bg-primary/80 active:scale-95 transition-all disabled:opacity-30 select-none"
        >
          {loading ? '…' : 'OK'}
        </button>
      </div>
    </div>
  )
}
