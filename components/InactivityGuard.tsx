'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'

const TIMEOUT_MS = 2 * 60 * 1000
const WARNING_MS = 30 * 1000

function isLoggedIn() {
  if (typeof window === 'undefined') return false
  return (
    sessionStorage.getItem('fca_trainer') === 'true' ||
    !!sessionStorage.getItem('fca_auth_player_id')
  )
}

function clearSession() {
  sessionStorage.removeItem('fca_trainer')
  sessionStorage.removeItem('fca_player_id')
  sessionStorage.removeItem('fca_player_name')
  sessionStorage.removeItem('fca_auth_player_id')
  sessionStorage.removeItem('fca_auth_player_name')
}

export default function InactivityGuard() {
  const router = useRouter()
  const pathname = usePathname()
  const [showWarning, setShowWarning] = useState(false)

  const logout = useCallback(() => {
    clearSession()
    router.push('/')
  }, [router])

  useEffect(() => {
    if (!isLoggedIn()) {
      setShowWarning(false)
      return
    }

    let warningTimer: ReturnType<typeof setTimeout>
    let logoutTimer: ReturnType<typeof setTimeout>
    let backgroundAt: number | null = null

    function reset() {
      setShowWarning(false)
      clearTimeout(warningTimer)
      clearTimeout(logoutTimer)
      warningTimer = setTimeout(() => setShowWarning(true), TIMEOUT_MS - WARNING_MS)
      logoutTimer = setTimeout(logout, TIMEOUT_MS)
    }

    function onVisibility() {
      if (document.visibilityState === 'hidden') {
        backgroundAt = Date.now()
      } else {
        if (backgroundAt !== null) {
          if (Date.now() - backgroundAt >= TIMEOUT_MS) {
            logout()
            return
          }
          backgroundAt = null
        }
        reset()
      }
    }

    const events = ['touchstart', 'click', 'keydown', 'mousemove', 'scroll']
    events.forEach(e => window.addEventListener(e, reset, { passive: true }))
    document.addEventListener('visibilitychange', onVisibility)
    reset()

    return () => {
      clearTimeout(warningTimer)
      clearTimeout(logoutTimer)
      events.forEach(e => window.removeEventListener(e, reset))
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [pathname, logout])

  if (!showWarning) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 max-w-2xl mx-auto z-50 pointer-events-none">
      <div className="rounded-xl border border-border bg-card shadow-lg px-4 py-3 flex items-center justify-between gap-3 pointer-events-auto">
        <p className="text-sm text-muted-foreground">Automatischer Logout in Kürze…</p>
        <button
          onClick={logout}
          className="text-sm font-semibold text-destructive shrink-0 hover:opacity-80 transition-opacity"
        >
          Jetzt ausloggen
        </button>
      </div>
    </div>
  )
}
