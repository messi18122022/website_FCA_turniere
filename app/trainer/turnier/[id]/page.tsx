'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function TrainerTurnierDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  useEffect(() => {
    router.replace(`/trainer/turnier/${id}/edit`)
  }, [id, router])

  return null
}
