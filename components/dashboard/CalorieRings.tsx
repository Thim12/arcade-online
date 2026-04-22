'use client'

// ─────────────────────────────────────────────────────────────────
// CalorieRings – Apple-Style konzentrische SVG Makro-Ringe
//
// Wiederverwendbare Komponente für das Dashboard.
// Nutzt Framer Motion für animierte Ringfüllungen.
// ─────────────────────────────────────────────────────────────────

import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { Flame, Beef, Wheat, Droplet } from 'lucide-react'

// ── Typen ─────────────────────────────────────────────────────────

interface MacroData {
  current: number
  target: number
}

interface CalorieRingsProps {
  calories: MacroData
  protein: MacroData
  carbs: MacroData
  fat: MacroData
  size?: number
  className?: string
}

interface RingConfig {
  label: string
  current: number
  target: number
  color: string
  trackColor: string
  radius: number
  strokeWidth: number
  icon: typeof Flame
  unit: string
}

// ── Animated Ring ─────────────────────────────────────────────────

interface AnimatedRingProps {
  percentage: number
  radius: number
  strokeWidth: number
  color: string
  trackColor: string
  center: number
}

function AnimatedRing({ percentage, radius, strokeWidth, color, trackColor, center }: AnimatedRingProps) {
  const circumference = 2 * Math.PI * radius
  const clampedFill = Math.min(Math.max(percentage / 100, 0), 1)
  const dashMotion = useMotionValue(0)
  const strokeDasharray = useTransform(
    dashMotion,
    (v: number) => `${v} ${circumference - v + 0.01}`,
  )

  useEffect(() => {
    const controls = animate(dashMotion, clampedFill * circumference, {
      duration: 1.4,
      ease: [0.16, 1, 0.3, 1],
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clampedFill, circumference])

  return (
    <>
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
        style={{ strokeDasharray }}
      />
    </>
  )
}

// ── Hauptkomponente ───────────────────────────────────────────────

export function CalorieRings({
  calories,
  protein,
  carbs,
  fat,
  size = 220,
  className = '',
}: CalorieRingsProps) {
  const center = size / 2
  const gap = 4

  const rings: RingConfig[] = [
    {
      label: 'Fett',
      current: fat.current,
      target: fat.target,
      color: '#EAB308',
      trackColor: 'rgba(234,179,8,0.12)',
      radius: center - 18,
      strokeWidth: 14,
      icon: Droplet,
      unit: 'g',
    },
    {
      label: 'Kohlenhydrate',
      current: carbs.current,
      target: carbs.target,
      color: '#F97316',
      trackColor: 'rgba(249,115,22,0.12)',
      radius: center - 18 - 14 - gap,
      strokeWidth: 14,
      icon: Wheat,
      unit: 'g',
    },
    {
      label: 'Protein',
      current: protein.current,
      target: protein.target,
      color: '#3B82F6',
      trackColor: 'rgba(59,130,246,0.12)',
      radius: center - 18 - (14 + gap) * 2,
      strokeWidth: 14,
      icon: Beef,
      unit: 'g',
    },
  ]

  const caloriePercent = calories.target > 0 ? Math.round((calories.current / calories.target) * 100) : 0

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* SVG Ringe */}
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          {rings.map((ring) => (
            <AnimatedRing
              key={ring.label}
              percentage={ring.target > 0 ? (ring.current / ring.target) * 100 : 0}
              radius={ring.radius}
              strokeWidth={ring.strokeWidth}
              color={ring.color}
              trackColor={ring.trackColor}
              center={center}
            />
          ))}

          {/* Zentraler Kalorien-Text */}
          <text
            x={center}
            y={center - 8}
            textAnchor="middle"
            fill="#18181B"
            fontSize={size > 180 ? 28 : 22}
            fontWeight="800"
            fontFamily="inherit"
          >
            {calories.current}
          </text>
          <text
            x={center}
            y={center + 14}
            textAnchor="middle"
            fill="#71717A"
            fontSize={11}
            fontFamily="inherit"
          >
            von {calories.target} kcal
          </text>
        </svg>

        {/* Prozent-Badge */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.8 }}
          className="absolute -top-1 -right-1 bg-white border border-zinc-200 rounded-full px-2.5 py-1 shadow-md"
        >
          <span
            className={`text-xs font-bold ${
              caloriePercent > 100 ? 'text-red-500' : caloriePercent >= 90 ? 'text-green-600' : 'text-zinc-600'
            }`}
          >
            {caloriePercent}%
          </span>
        </motion.div>
      </div>

      {/* Makro-Legende */}
      <div className="flex gap-4 mt-4">
        {rings.map((ring) => {
          const pct = ring.target > 0 ? Math.round((ring.current / ring.target) * 100) : 0
          const remaining = Math.max(0, ring.target - ring.current)
          return (
            <motion.div
              key={ring.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="flex items-center gap-1 mb-1">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: ring.color }}
                />
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">
                  {ring.label}
                </span>
              </div>
              <span className="text-sm font-bold text-zinc-900 tabular-nums">
                {ring.current}{ring.unit}
              </span>
              <span className="text-[10px] text-zinc-400">
                {remaining > 0 ? `${remaining}${ring.unit} übrig` : 'Ziel erreicht'}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ── Kompakt-Variante für Sidebar / Cards ──────────────────────────

interface CalorieRingsMiniProps {
  calories: number
  target: number
  size?: number
}

export function CalorieRingsMini({ calories, target, size = 56 }: CalorieRingsMiniProps) {
  const center = size / 2
  const radius = center - 5
  const circumference = 2 * Math.PI * radius
  const pct = target > 0 ? Math.min(calories / target, 1) : 0
  const dashMotion = useMotionValue(0)
  const strokeDasharray = useTransform(
    dashMotion,
    (v: number) => `${v} ${circumference - v + 0.01}`,
  )

  useEffect(() => {
    const controls = animate(dashMotion, pct * circumference, {
      duration: 1,
      ease: [0.4, 0, 0.2, 1],
    })
    return () => controls.stop()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pct, circumference])

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(22,163,74,0.12)"
          strokeWidth={5}
        />
        <motion.circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="#16A34A"
          strokeWidth={5}
          strokeLinecap="round"
          transform={`rotate(-90 ${center} ${center})`}
          style={{ strokeDasharray }}
        />
        <text
          x={center}
          y={center + 4}
          textAnchor="middle"
          fill="#18181B"
          fontSize={12}
          fontWeight="700"
          fontFamily="inherit"
        >
          {Math.round((pct) * 100)}%
        </text>
      </svg>
    </div>
  )
}
