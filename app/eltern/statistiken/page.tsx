'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StatsContent from '@/components/StatsContent'

export default function ElternStatistikenPage() {
  const router = useRouter()

  useEffect(() => {
    const id = sessionStorage.getItem('fca_auth_player_id')
    if (!id) router.replace('/eltern')
  }, [router])

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight">Statistiken</h1>
        <p className="text-sm text-muted-foreground mt-1">All-Time</p>
      </div>
      <StatsContent />
    </div>
  )
}
