'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { checkTrainerPin } from '@/app/actions'
import Numpad from '@/components/Numpad'

export default function TrainerPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handlePin(pin: string) {
    setLoading(true)
    setError(null)

    const ok = await checkTrainerPin(pin)
    setLoading(false)

    if (!ok) {
      setError('Falscher PIN. Bitte erneut versuchen.')
      return
    }

    sessionStorage.setItem('fca_trainer', 'true')
    router.push('/trainer/turniere')
  }

  return (
    <Numpad
      mode="pin"
      title="Trainer-Login"
      subtitle="PIN eingeben"
      onComplete={handlePin}
      error={error}
      loading={loading}
      backHref="/"
    />
  )
}
