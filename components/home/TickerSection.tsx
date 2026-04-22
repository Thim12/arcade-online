'use client'

import { useRef, useState, useCallback } from 'react'
import { motion, useAnimationFrame } from 'framer-motion'

interface TickerItem {
  id: string
  text: string
}

interface TickerSectionProps {
  items: TickerItem[]
}

const FALLBACK_ITEMS: TickerItem[] = [
  { id: 'f01', text: 'Lukas aus Frankfurt — 45 Min. Fussball-Training absolviert' },
  { id: 'f02', text: 'Anna aus Wiesbaden folgt jetzt dem TSV Einheit Frankfurt' },
  { id: 'f03', text: 'Max hat das Abzeichen "Erster Schritt" erhalten' },
  { id: 'f04', text: 'Jonas aus Kassel — 60 Min. Basketball-Training absolviert' },
  { id: 'f05', text: 'Sarah folgt jetzt dem TC Rot-Weiss Kassel' },
  { id: 'f06', text: 'Tim hat das Abzeichen "7 Tage am Stueck" erhalten' },
  { id: 'f07', text: 'Felix aus Darmstadt — 30 Min. Tennis-Training absolviert' },
  { id: 'f08', text: 'Laura aus Fulda folgt jetzt dem VfB 1900 Giessen' },
  { id: 'f09', text: 'Marco aus Giessen — 50 Min. Fussball-Training absolviert' },
  { id: 'f10', text: 'Nina hat das Abzeichen "Durchstarter" erhalten' },
  { id: 'f11', text: 'Kevin aus Offenbach — 40 Min. Basketball-Training absolviert' },
  { id: 'f12', text: 'Lena folgt jetzt dem TSG Marburg Tennis' },
]

function TickerRow({ items }: { items: TickerItem[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)
  const [paused, setPaused] = useState(false)
  const speed = 0.5

  useAnimationFrame((_, delta) => {
    if (paused) return
    setOffset((prev) => {
      const halfWidth = ref.current ? ref.current.scrollWidth / 2 : 0
      const next = prev + (delta / 1000) * speed * 100
      return halfWidth > 0 && next >= halfWidth ? 0 : next
    })
  })

  const handleMouseEnter = useCallback(() => setPaused(true), [])
  const handleMouseLeave = useCallback(() => setPaused(false), [])

  return (
    <div
      className="overflow-hidden relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="absolute inset-y-0 left-0 w-20 z-10 pointer-events-none bg-gradient-to-r from-white to-transparent" />
      <div className="absolute inset-y-0 right-0 w-20 z-10 pointer-events-none bg-gradient-to-l from-white to-transparent" />

      <div ref={ref} className="flex whitespace-nowrap">
        <motion.div
          className="flex"
          style={{ x: -offset }}
        >
          {items.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-2.5 mx-6"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-sm text-zinc-500 font-medium whitespace-nowrap">
                {item.text}
              </span>
            </span>
          ))}
          {items.map((item) => (
            <span
              key={`${item.id}-dup`}
              className="inline-flex items-center gap-2.5 mx-6"
              aria-hidden="true"
            >
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className="text-sm text-zinc-500 font-medium whitespace-nowrap">
                {item.text}
              </span>
            </span>
          ))}
        </motion.div>
      </div>
    </div>
  )
}

export default function TickerSection({ items }: TickerSectionProps) {
  const display: TickerItem[] = items.length > 0 ? items : FALLBACK_ITEMS

  return (
    <section
      className="w-full bg-white border-y border-zinc-100 py-4"
      aria-label="Aktuelle Aktivitaeten"
    >
      <div className="px-4 overflow-hidden">
        <TickerRow items={display} />
      </div>
    </section>
  )
}