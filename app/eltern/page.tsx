'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Player } from '@/lib/types'

export default function ElternPage() {
  const router = useRouter()
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('players')
      .select('id, vorname')
      .eq('active', true)
      .order('vorname')
      .then(({ data }) => {
        setPlayers((data as Player[]) ?? [])
        setLoading(false)
      })
  }, [])

  function selectPlayer(player: Player) {
    sessionStorage.setItem('fca_player_id', player.id)
    sessionStorage.setItem('fca_player_name', player.vorname)
    router.push('/eltern/pin')
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/" className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/60 transition-colors shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">Welches Kind?</h1>
      </div>

      {loading && (
        <div className="space-y-2">
          {[1,2,3,4,5].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      )}

      {!loading && (
        <div className="space-y-2">
          {players.map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => selectPlayer(player)}
              className="w-full flex items-center justify-between rounded-xl border border-border/60 px-4 py-4 text-left hover:border-border hover:bg-muted/40 active:scale-[0.99] transition-all"
            >
              <span className="text-base font-semibold">{player.vorname}</span>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
