'use client'

// ─────────────────────────────────────────────────────────────────
// WieEsFunktioniertSection – "In 3 Minuten startklar." (Premium Dark)
//
// Design: Dunkler Hintergrund, glowing Schritt-Nummern,
// Premium SVG-Illustrationen, Verbindungslinien
// ─────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion'

// ── SVG-Illustrationen ────────────────────────────────────────────

function FormSvg() {
  return (
    <svg viewBox="0 0 320 230" fill="none" className="w-full max-w-sm mx-auto" aria-hidden="true">
      <rect x="0" y="0" width="320" height="230" rx="20" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      <rect x="24" y="24" width="130" height="12" rx="4" fill="rgba(255,255,255,0.08)" />
      <rect x="206" y="20" width="90" height="20" rx="8" fill="rgba(22,163,74,0.12)" />
      <rect x="218" y="26" width="66" height="8" rx="3" fill="#16A34A" fillOpacity="0.4" />
      <rect x="24" y="52" width="52" height="8" rx="3" fill="rgba(255,255,255,0.06)" />
      <rect x="24" y="65" width="272" height="34" rx="9" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      <rect x="38" y="77" width="2" height="10" rx="1" fill="#16A34A" />
      <rect x="24" y="113" width="64" height="8" rx="3" fill="rgba(255,255,255,0.06)" />
      <rect x="24" y="126" width="272" height="34" rx="9" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      <rect x="36" y="135" width="70" height="16" rx="6" fill="rgba(22,163,74,0.12)" />
      <rect x="44" y="139" width="54" height="8" rx="3" fill="#16A34A" fillOpacity="0.4" />
      <rect x="24" y="178" width="272" height="38" rx="10" fill="#16A34A" />
      <rect x="104" y="193" width="112" height="8" rx="3" fill="white" fillOpacity="0.7" />
    </svg>
  )
}

function WeeklyPlanSvg() {
  const bars: { x: number; h: number }[] = [
    { x: 26, h: 88 },
    { x: 82, h: 58 },
    { x: 138, h: 108 },
    { x: 194, h: 68 },
    { x: 250, h: 95 },
  ]
  const barW = 44
  const baseY = 188

  return (
    <svg viewBox="0 0 320 230" fill="none" className="w-full max-w-sm mx-auto" aria-hidden="true">
      <rect x="0" y="0" width="320" height="230" rx="20" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      <rect x="24" y="24" width="128" height="12" rx="4" fill="rgba(255,255,255,0.08)" />
      <rect x="210" y="20" width="86" height="20" rx="8" fill="rgba(22,163,74,0.12)" />
      <rect x="220" y="26" width="66" height="8" rx="3" fill="#16A34A" fillOpacity="0.4" />
      {bars.map((bar, i) => (
        <g key={i}>
          <rect
            x={bar.x}
            y={baseY - bar.h}
            width={barW}
            height={bar.h}
            rx="6"
            fill="#16A34A"
            fillOpacity={i % 2 === 0 ? 0.7 : 0.35}
          />
          <rect
            x={bar.x + 8}
            y={baseY + 8}
            width={barW - 16}
            height={7}
            rx="3"
            fill="rgba(255,255,255,0.08)"
          />
        </g>
      ))}
    </svg>
  )
}

function VereinCardsSvg() {
  return (
    <svg viewBox="0 0 320 230" fill="none" className="w-full max-w-sm mx-auto" aria-hidden="true">
      <rect x="20" y="30" width="280" height="108" rx="14" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.04)" strokeWidth="1.5" transform="rotate(-3 160 84)" />
      <rect x="20" y="50" width="280" height="108" rx="14" fill="rgba(255,255,255,0.025)" stroke="rgba(255,255,255,0.05)" strokeWidth="1.5" transform="rotate(1.5 160 104)" />
      <rect x="20" y="72" width="280" height="120" rx="14" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
      <rect x="20" y="72" width="6" height="120" rx="3" fill="#16A34A" />
      <circle cx="62" cy="132" r="22" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.06)" />
      <rect x="52" y="126" width="20" height="12" rx="3" fill="rgba(255,255,255,0.08)" />
      <rect x="96" y="110" width="130" height="12" rx="4" fill="rgba(255,255,255,0.08)" />
      <rect x="96" y="128" width="96" height="8" rx="3" fill="rgba(255,255,255,0.06)" />
      <rect x="96" y="143" width="74" height="8" rx="3" fill="rgba(22,163,74,0.2)" />
      <rect x="236" y="112" width="52" height="28" rx="8" fill="rgba(22,163,74,0.15)" />
      <rect x="246" y="122" width="32" height="8" rx="3" fill="#16A34A" fillOpacity="0.5" />
    </svg>
  )
}

// ── Schritt-Daten ─────────────────────────────────────────────────

type SvgFC = () => JSX.Element

interface Step {
  number: string
  badge: string
  title: string
  description: string
  aiHint: boolean
  IllustrationComponent: SvgFC
}

const STEPS: Step[] = [
  {
    number: '01',
    badge: '< 2 Min',
    title: 'Sportler-Profil erstellen',
    description:
      'Position und Liga beim Fußball, Leistungsklasse beim Tennis, Position und Körpergröße beim Basketball. Unter 14: Eltern-E-Mail, das war\'s.',
    aiHint: false,
    IllustrationComponent: FormSvg,
  },
  {
    number: '02',
    badge: 'Sofort',
    title: 'Eigene KI erstellt deinen Plan',
    description:
      'Selbst programmierte KIs — eine für Fußball, eine für Tennis, eine für Basketball, kein Bot — erstellen sofort positionsspezifische Pläne. Verletzungen und Recovery werden berücksichtigt.',
    aiHint: true,
    IllustrationComponent: WeeklyPlanSvg,
  },
  {
    number: '03',
    badge: 'Kostenlos',
    title: 'Verein finden und aufsteigen',
    description:
      'Eigene VereinKI analysiert alle Hessen-Vereine und empfiehlt die drei besten mit persönlicher Begründung. Bald auch bundesweit.',
    aiHint: false,
    IllustrationComponent: VereinCardsSvg,
  },
]

// ── Komponente ────────────────────────────────────────────────────

export default function WieEsFunktioniertSection() {
  return (
    <section id="wie-es-funktioniert" className="relative bg-[#030712] py-28 sm:py-36 overflow-hidden">
      {/* Subtiler Gradient */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] pointer-events-none select-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(22,163,74,0.04) 0%, transparent 60%)',
          filter: 'blur(80px)',
        }}
        aria-hidden="true"
      />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          className="text-center mb-24 sm:mb-32"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-[52px] font-bold text-white tracking-tight leading-[1.1]">
            In 3 Minuten startklar.
          </h2>
          <p className="mt-5 text-lg text-white/35 max-w-md mx-auto">
            Kein Setup. Kein Abo. Einfach loslegen.
          </p>
        </motion.div>

        {/* Schritte */}
        <div className="space-y-28 sm:space-y-36">
          {STEPS.map((step, i) => {
            const isNormal = i % 2 === 0
            const { IllustrationComponent } = step

            return (
              <motion.div
                key={step.number}
                className={`relative flex flex-col ${
                  isNormal ? 'md:flex-row' : 'md:flex-row-reverse'
                } gap-12 md:gap-20 items-center`}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                {/* Dekorations-Zahl mit Glow */}
                <span
                  className="absolute -top-12 -left-4 md:-left-8 z-0 font-black leading-none select-none pointer-events-none text-[140px] md:text-[180px]"
                  style={{
                    color: 'transparent',
                    WebkitTextStroke: '1px rgba(255,255,255,0.04)',
                  }}
                  aria-hidden="true"
                >
                  {step.number}
                </span>

                {/* Text-Inhalt */}
                <div className="relative z-10 flex-1 max-w-lg">
                  {/* Badge */}
                  <span className="inline-block bg-green-500/10 text-green-400 text-xs font-semibold px-3 py-1 rounded-full mb-4 border border-green-500/20">
                    {step.badge}
                  </span>

                  <h3 className="text-2xl sm:text-3xl font-bold text-white mb-4 tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-base text-white/40 leading-relaxed">
                    {step.description}
                  </p>

                  {/* KI-Hinweis (nur Schritt 02) */}
                  {step.aiHint && (
                    <p className="mt-5 text-xs text-white/30 bg-white/[0.03] border border-white/[0.06] rounded-lg px-4 py-2.5 inline-block">
                      Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
                    </p>
                  )}
                </div>

                {/* Illustration */}
                <div className="relative z-10 flex-1 w-full">
                  <IllustrationComponent />
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
