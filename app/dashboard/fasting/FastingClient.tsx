'use client'

// ─────────────────────────────────────────────────────────────────
// FastingClient – Client-Wrapper für Fasting Page
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FastingTimer } from '@/components/fasting/FastingTimer'

interface FastingLogData {
  id: string
  startTime: string
  endTime: string | null
  targetDurationHours: number
  fastingType: string
  status: string
}

interface FastingClientProps {
  initialActiveFast: FastingLogData | null
  initialRecentFasts: FastingLogData[]
}

export function FastingClient({ initialActiveFast, initialRecentFasts }: FastingClientProps) {
  const [activeFast, setActiveFast] = useState(initialActiveFast)
  const [recentFasts, setRecentFasts] = useState(initialRecentFasts)
  const router = useRouter()

  const handleStartFast = useCallback(async (fastingType: string, targetHours: number) => {
    const res = await fetch('/api/fasting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', fastingType, targetDurationHours: targetHours }),
    })

    if (!res.ok) throw new Error('Fasten konnte nicht gestartet werden.')

    const data = await res.json() as { fast: FastingLogData }
    setActiveFast(data.fast)
    setRecentFasts((prev) => [data.fast, ...prev])
  }, [])

  const handleStopFast = useCallback(async (id: string) => {
    const res = await fetch('/api/fasting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'stop', fastingLogId: id }),
    })

    if (!res.ok) throw new Error('Fasten konnte nicht beendet werden.')

    const data = await res.json() as { fast: FastingLogData }
    setActiveFast(null)
    setRecentFasts((prev) =>
      prev.map((f) => (f.id === id ? data.fast : f)),
    )
    router.refresh()
  }, [router])

  return (
    <FastingTimer
      activeFast={activeFast}
      recentFasts={recentFasts}
      onStartFast={handleStartFast}
      onStopFast={handleStopFast}
    />
  )
}
