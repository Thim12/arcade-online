'use client'

// ─────────────────────────────────────────────────────────────────
// app/training/statistiken/StatsClient.tsx
//
// Client Component für die Statistiken-Seite.
// Heatmap und BarChart sind reine SVG – kein recharts.
// ─────────────────────────────────────────────────────────────────

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Flame, Clock, Zap, TrendingUp, Calendar, Award } from 'lucide-react'
import type { StatsData, ActivityCell, WeeklyBar } from './page'

// ─────────────────────────────────────────────────────────────────
// Konstanten & Hilfsfunktionen
// ─────────────────────────────────────────────────────────────────

function formatMinutes(min: number): string {
  if (min < 60) return `${min} Min`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m === 0 ? `${h} Std` : `${h} Std ${m} Min`
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

// Aktivitätslevel → Opazität
function cellOpacity(count: number): number {
  if (count === 0) return 0
  if (count === 1) return 0.3
  if (count === 2) return 0.55
  if (count === 3) return 0.75
  return 1.0
}

// ─────────────────────────────────────────────────────────────────
// Stats-Card
// ─────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  sub,
  delay,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  sub?: string
  delay: number
  color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.45, ease: 'easeOut' }}
      className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color}20` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
      <div className="text-2xl font-bold text-white tabular-nums">{value}</div>
      <div className="text-sm text-white/60 mt-0.5">{label}</div>
      {sub !== undefined && (
        <div className="text-xs text-white/30 mt-1">{sub}</div>
      )}
    </motion.div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Activity Heatmap (SVG)
// ─────────────────────────────────────────────────────────────────

const CELL_SIZE = 11
const CELL_GAP  = 2
const TOTAL_CELL = CELL_SIZE + CELL_GAP

const DAY_LABELS = ['Mo', '', 'Mi', '', 'Fr', '', 'So']

function ActivityHeatmap({
  grid,
  color,
}: {
  grid: ActivityCell[][]
  color: string
}) {
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    date: string
    count: number
  } | null>(null)

  const weekCount = grid.length   // 52
  const dayCount  = grid[0]?.length ?? 7

  const svgWidth  = weekCount * TOTAL_CELL + 24 // extra for day labels
  const svgHeight = dayCount * TOTAL_CELL + 16  // extra for month labels

  // Monats-Labels: zeige Monatsnamen für erste Woche des Monats
  const monthLabels: Array<{ x: number; label: string }> = []
  for (let w = 0; w < weekCount; w++) {
    const cell = grid[w]?.[0]
    if (cell === undefined) continue
    const d = new Date(cell.date)
    // Erste Woche des Monats
    if (d.getDate() <= 7) {
      monthLabels.push({
        x: 24 + w * TOTAL_CELL,
        label: d.toLocaleDateString('de-DE', { month: 'short' }),
      })
    }
  }

  return (
    <div className="relative overflow-x-auto">
      <svg
        width={svgWidth}
        height={svgHeight}
        className="block"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Tag-Labels */}
        {DAY_LABELS.map((label, day) => (
          <text
            key={day}
            x={0}
            y={16 + day * TOTAL_CELL + CELL_SIZE / 2 + 3}
            className="fill-white/25 text-[9px]"
            fontSize={9}
            fontFamily="system-ui, sans-serif"
          >
            {label}
          </text>
        ))}

        {/* Monat-Labels */}
        {monthLabels.map(({ x, label }) => (
          <text
            key={`${x}-${label}`}
            x={x}
            y={9}
            className="fill-white/30 text-[9px]"
            fontSize={9}
            fontFamily="system-ui, sans-serif"
          >
            {label}
          </text>
        ))}

        {/* Kacheln */}
        {grid.map((week, w) =>
          week.map((cell, d) => {
            const x = 24 + w * TOTAL_CELL
            const y = 16 + d * TOTAL_CELL
            const opacity = cellOpacity(cell.count)

            return (
              <rect
                key={`${w}-${d}`}
                x={x}
                y={y}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={2}
                ry={2}
                fill={cell.count === 0 ? 'rgba(255,255,255,0.05)' : color}
                fillOpacity={cell.count === 0 ? 1 : opacity}
                className="cursor-pointer transition-opacity duration-100 hover:opacity-90"
                onMouseEnter={(e) => {
                  const rect = (e.target as SVGRectElement).getBoundingClientRect()
                  const svgRect = (e.target as SVGRectElement).closest('svg')?.getBoundingClientRect()
                  if (svgRect === undefined) return
                  setTooltip({
                    x: rect.left - svgRect.left + CELL_SIZE / 2,
                    y: rect.top  - svgRect.top,
                    date: cell.date,
                    count: cell.count,
                  })
                }}
              />
            )
          }),
        )}

        {/* Tooltip */}
        {tooltip !== null && (
          <g>
            <rect
              x={Math.min(tooltip.x - 45, svgWidth - 95)}
              y={tooltip.y - 34}
              width={90}
              height={26}
              rx={5}
              fill="rgba(0,0,0,0.85)"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth={0.5}
            />
            <text
              x={Math.min(tooltip.x - 45, svgWidth - 95) + 45}
              y={tooltip.y - 17}
              textAnchor="middle"
              fill="rgba(255,255,255,0.85)"
              fontSize={9}
              fontFamily="system-ui, sans-serif"
            >
              {new Date(tooltip.date).toLocaleDateString('de-DE', {
                day: '2-digit', month: 'short',
              })}
              {' · '}
              {tooltip.count === 0 ? 'kein Training' : `${tooltip.count} Einheit${tooltip.count > 1 ? 'en' : ''}`}
            </text>
          </g>
        )}
      </svg>

      {/* Legende */}
      <div className="flex items-center gap-2 mt-2">
        <span className="text-xs text-white/30">Weniger</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className="w-3 h-3 rounded-sm"
            style={{
              background: level === 0 ? 'rgba(255,255,255,0.05)' : color,
              opacity: level === 0 ? 1 : cellOpacity(level),
            }}
          />
        ))}
        <span className="text-xs text-white/30">Mehr</span>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Wöchentlicher SVG-BarChart
// ─────────────────────────────────────────────────────────────────

function WeeklyBarChart({
  bars,
  color,
}: {
  bars: WeeklyBar[]
  color: string
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  const maxSessions = Math.max(...bars.map((b) => b.sessions), 1)
  const chartHeight = 120
  const barWidth    = 24
  const barGap      = 12
  const totalWidth  = bars.length * (barWidth + barGap) - barGap
  const paddingX    = 8
  const svgWidth    = totalWidth + paddingX * 2
  const svgHeight   = chartHeight + 40

  return (
    <div className="relative overflow-x-auto">
      <svg width={svgWidth} height={svgHeight} className="block">
        {bars.map((bar, i) => {
          const barHeight = maxSessions > 0
            ? Math.max((bar.sessions / maxSessions) * chartHeight, bar.sessions > 0 ? 6 : 0)
            : 0
          const x = paddingX + i * (barWidth + barGap)
          const y = chartHeight - barHeight
          const isHovered = hoveredIndex === i

          return (
            <g key={bar.isoWeek}>
              {/* Hintergrundbalken */}
              <rect
                x={x}
                y={0}
                width={barWidth}
                height={chartHeight}
                rx={6}
                fill="rgba(255,255,255,0.04)"
              />

              {/* Daten-Balken */}
              {bar.sessions > 0 && (
                <motion.rect
                  x={x}
                  y={y}
                  width={barWidth}
                  initial={{ height: 0, y: chartHeight }}
                  animate={{ height: barHeight, y }}
                  transition={{ delay: i * 0.05, duration: 0.5, ease: 'easeOut' }}
                  rx={6}
                  fill={color}
                  fillOpacity={isHovered ? 1 : 0.75}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />
              )}

              {/* Wert über Balken */}
              {bar.sessions > 0 && (
                <text
                  x={x + barWidth / 2}
                  y={y - 5}
                  textAnchor="middle"
                  fill={isHovered ? '#fff' : 'rgba(255,255,255,0.5)'}
                  fontSize={10}
                  fontFamily="system-ui, sans-serif"
                  fontWeight="600"
                >
                  {bar.sessions}
                </text>
              )}

              {/* KW-Label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + 14}
                textAnchor="middle"
                fill="rgba(255,255,255,0.3)"
                fontSize={9}
                fontFamily="system-ui, sans-serif"
              >
                {bar.weekLabel.replace('KW ', '')}
              </text>

              {/* Hover-Tooltip */}
              {isHovered && bar.sessions > 0 && (
                <g>
                  <rect
                    x={Math.min(x - 10, svgWidth - 100)}
                    y={y - 46}
                    width={96}
                    height={36}
                    rx={6}
                    fill="rgba(0,0,0,0.9)"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={0.5}
                  />
                  <text
                    x={Math.min(x - 10, svgWidth - 100) + 48}
                    y={y - 30}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.9)"
                    fontSize={10}
                    fontFamily="system-ui, sans-serif"
                    fontWeight="600"
                  >
                    {bar.weekLabel}
                  </text>
                  <text
                    x={Math.min(x - 10, svgWidth - 100) + 48}
                    y={y - 16}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.5)"
                    fontSize={9}
                    fontFamily="system-ui, sans-serif"
                  >
                    {bar.sessions} Einheit{bar.sessions !== 1 ? 'en' : ''} · {formatMinutes(bar.totalMinutes)}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* X-Achsen-Label */}
        <text
          x={svgWidth / 2}
          y={svgHeight - 2}
          textAnchor="middle"
          fill="rgba(255,255,255,0.2)"
          fontSize={9}
          fontFamily="system-ui, sans-serif"
        >
          Kalenderwochen
        </text>
      </svg>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// Haupt-Component
// ─────────────────────────────────────────────────────────────────

export function StatsClient({ data }: { data: StatsData }) {
  const color = data.sportColorPrimary

  const sportGradient =
    data.sportSlug === 'tennis'    ? 'from-orange-950 to-gray-950' :
    data.sportSlug === 'basketball' ? 'from-orange-950 to-gray-950' :
    'from-green-950 to-gray-950'

  return (
    <div
      className="min-h-screen bg-[#0a0a0f] text-white"
      style={{
        // CSS Custom Properties direkt setzen
        ['--sport-primary' as string]:  data.sportColorPrimary,
        ['--sport-glow' as string]:     data.sportColorGlow,
      }}
    >
      {/* Page Header */}
      <div className={`relative bg-gradient-to-b ${sportGradient} px-4 pt-10 pb-16`}>
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-3xl font-bold text-white">Meine Statistiken</h1>
            <p className="text-sm mt-1" style={{ color: `${color}cc` }}>
              {data.sportName} · Gesamtübersicht
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-8 pb-16 space-y-8">
        {/* 2×2 Stats-Cards */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard
            icon={<Clock size={18} />}
            label="Trainingsminuten"
            value={formatMinutes(data.totalMinutes)}
            sub={`${data.totalSessions} Einheiten`}
            delay={0.05}
            color={color}
          />
          <StatCard
            icon={<Flame size={18} />}
            label="Kalorien (ca.)"
            value={formatNumber(data.estimatedCalories)}
            sub="Gesamtverbrennung"
            delay={0.1}
            color={color}
          />
          <StatCard
            icon={<TrendingUp size={18} />}
            label="Aktueller Streak"
            value={`${data.currentStreak} Tage`}
            sub={`Längster: ${data.longestStreak} Tage`}
            delay={0.15}
            color={color}
          />
          <StatCard
            icon={<Zap size={18} />}
            label="Gesamt-XP"
            value={formatNumber(data.totalXP)}
            sub="Erfahrungspunkte"
            delay={0.2}
            color={color}
          />
        </div>

        {/* Aktivitäts-Heatmap */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={16} style={{ color }} />
            <h2 className="text-sm font-semibold text-white/80">
              Aktivität – letzte 52 Wochen
            </h2>
          </div>
          <ActivityHeatmap grid={data.activityGrid} color={color} />
        </motion.div>

        {/* Wöchentlicher Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} style={{ color }} />
              <h2 className="text-sm font-semibold text-white/80">
                Einheiten – letzte 8 Wochen
              </h2>
            </div>
            <span className="text-xs text-white/30">
              Beste Woche: {data.bestWeekSessions} Einheiten
            </span>
          </div>
          <WeeklyBarChart bars={data.weeklyBars} color={color} />
        </motion.div>

        {/* Personal Records */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.5 }}
          className="p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Award size={16} style={{ color }} />
            <h2 className="text-sm font-semibold text-white/80">Persönliche Bestleistungen</h2>
          </div>
          <div className="divide-y divide-white/5">
            {[
              {
                label: 'Längste Einheit',
                value: formatMinutes(data.bestSessionMinutes),
                sub: 'Einzelsession',
              },
              {
                label: 'Beste Woche',
                value: `${data.bestWeekSessions} Einheiten`,
                sub: 'In einer Woche',
              },
              {
                label: 'Längster Streak',
                value: `${data.longestStreak} Tage`,
                sub: 'Aufeinanderfolgende Tage',
              },
              {
                label: 'Gesamte Trainingszeit',
                value: formatMinutes(data.totalMinutes),
                sub: `${data.totalSessions} abgeschlossene Einheiten`,
              },
            ].map(({ label, value, sub }) => (
              <div key={label} className="flex items-center justify-between py-3">
                <div>
                  <div className="text-sm text-white/80 font-medium">{label}</div>
                  <div className="text-xs text-white/40 mt-0.5">{sub}</div>
                </div>
                <div
                  className="text-base font-bold tabular-nums"
                  style={{ color }}
                >
                  {value}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Attribution */}
        <div className="text-center">
          <p className="text-xs text-white/20">
            Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
          </p>
        </div>
      </div>

      {/* Sport Custom Properties CSS */}
      <style>{`
        :root {
          --sport-primary: ${data.sportColorPrimary};
          --sport-glow: ${data.sportColorGlow};
        }
      `}</style>
    </div>
  )
}
