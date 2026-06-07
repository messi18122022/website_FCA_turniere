'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Numpad from '@/components/Numpad'

export default function ElternPinPage() {
  const router = useRouter()
  const [playerName, setPlayerName] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const id = sessionStorage.getItem('fca_player_id')
    const name = sessionStorage.getItem('fca_player_name')
    if (!id || !name) {
      router.replace('/eltern')
      return
    }
    setPlayerId(id)
    setPlayerName(name)
  }, [router])

  async function handleComplete(digits: string) {
    // digits = '08062018' → '2018-06-08'
    const dd = digits.slice(0, 2)
    const mm = digits.slice(2, 4)
    const yyyy = digits.slice(4, 8)
    const birthdate = `${yyyy}-${mm}-${dd}`

    setLoading(true)
    setError(null)

    const { data } = await supabase
      .from('players')
      .select('birthdate')
      .eq('id', playerId)
      .single()

    setLoading(false)

    if (!data?.birthdate) {
      setError('Kein Geburtsdatum hinterlegt. Bitte den Trainer kontaktieren.')
      return
    }

    if (data.birthdate !== birthdate) {
      setError('Geburtsdatum stimmt nicht. Bitte erneut versuchen.')
      return
    }

    sessionStorage.setItem('fca_auth_player_id', playerId)
    sessionStorage.setItem('fca_auth_player_name', playerName)
    router.push('/eltern/turniere')
  }

  if (!playerName) return null

  return (
    <Numpad
      mode="date"
      title={`Hallo, ${playerName}!`}
      subtitle="Bitte Geburtsdatum eingeben zur Bestätigung"
      onComplete={handleComplete}
      error={error}
      loading={loading}
    />
  )
}
