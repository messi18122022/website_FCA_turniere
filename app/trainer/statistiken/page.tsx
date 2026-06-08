'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import StatsContent from '@/components/StatsContent'

export default function TrainerStatistikenPage() {
  const router = useRouter()

  useEffect(() => {
    if (sessionStorage.getItem('fca_trainer') !== 'true') {
      router.replace('/trainer')
    }
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
