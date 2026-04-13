'use client'

// ─────────────────────────────────────────────────────────────────
// WieEsFunktioniertSection – "In 3 Minuten startklar."
//
// • id="wie-es-funktioniert" (Scroll-Anker aus Navbar/Hero)
// • 3 Schritte mit alternierendem Layout (Desktop: L/R/L)
// • SVG-Illustrationen: Formular, Wochenplan, Vereinskarten
// • KI-Hinweis in Schritt 02: DSGVO-konform, eigene KI
// ─────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion'

// ── SVG-Illustrationen ────────────────────────────────────────────

function FormSvg() {
  return (
    <svg
      viewBox="0 0 320 230"
      fill="none"
      className="w-full max-w-sm mx-auto"
      aria-hidden="true"
    >
      {/* Karte */}
      <rect x="0" y="0" width="320" height="230" rx="20" fill="white" stroke="#E4E4E7" strokeWidth="1.5" />

      {/* Header-Titel-Balken */}
      <rect x="24" y="24" width="130" height="12" rx="4" fill="#D4D4D8" />
      {/* Sport-Badge */}
      <rect x="206" y="20" width="90" height="20" rx="8" fill="#DCFCE7" />
      <rect x="218" y="26" width="66" height="8" rx="3" fill="#16A34A" fillOpacity="0.5" />

      {/* Label Feld 1 */}
      <rect x="24" y="52" width="52" height="8" rx="3" fill="#E4E4E7" />
      {/* Input Feld 1 */}
      <rect x="24" y="65" width="272" height="34" rx="9" fill="#F4F4F5" stroke="#E4E4E7" strokeWidth="1.5" />
      {/* Cursor */}
      <rect x="38" y="77" width="2" height="10" rx="1" fill="#16A34A" />

      {/* Label Feld 2 */}
      <rect x="24" y="113" width="64" height="8" rx="3" fill="#E4E4E7" />
      {/* Input Feld 2 */}
      <rect x="24" y="126" width="272" height="34" rx="9" fill="#F4F4F5" stroke="#E4E4E7" strokeWidth="1.5" />
      {/* Vorausgefüllter Chip */}
      <rect x="36" y="135" width="70" height="16" rx="6" fill="#DCFCE7" />
      <rect x="44" y="139" width="54" height="8" rx="3" fill="#16A34A" fillOpacity="0.55" />

      {/* Submit-Button */}
      <rect x="24" y="178" width="272" height="38" rx="10" fill="#16A34A" />
      <rect x="104" y="193" width="112" height="8" rx="3" fill="white" fillOpacity="0.7" />
    </svg>
  )
}

function WeeklyPlanSvg() {
  const bars: { x: number; h: number }[] = [
    { x: 26,  h: 88 },
    { x: 82,  h: 58 },
    { x: 138, h: 108 },
    { x: 194, h: 68 },
    { x: 250, h: 95 },
  ]
  const barW = 44
  const baseY = 188

  return (
    <svg
      viewBox="0 0 320 230"
      fill="none"
      className="w-full max-w-sm mx-auto"
      aria-hidden="true"
    >
      {/* Karte */}
      <rect x="0" y="0" width="320" height="230" rx="20" fill="white" stroke="#E4E4E7" strokeWidth="1.5" />

      {/* Titel */}
      <rect x="24" y="24" width="128" height="12" rx="4" fill="#D4D4D8" />
      {/* KI-Label */}
      <rect x="210" y="20" width="86" height="20" rx="8" fill="#DCFCE7" />
      <rect x="220" y="26" width="66" height="8" rx="3" fill="#16A34A" fillOpacity="0.5" />

      {/* Balken */}
      {bars.map((bar, i) => (
        <g key={i}>
          <rect
            x={bar.x}
            y={baseY - bar.h}
            width={barW}
            height={bar.h}
            rx="6"
            fill="#16A34A"
            fillOpacity={i % 2 === 0 ? 0.82 : 0.48}
          />
          {/* Tages-Label */}
          <rect
            x={bar.x + 8}
            y={baseY + 8}
            width={barW - 16}
            height={7}
            rx="3"
            fill="#D4D4D8"
          />
        </g>
      ))}
    </svg>
  )
}

function VereinCardsSvg() {
  return (
    <svg
      viewBox="0 0 320 230"
      fill="none"
      className="w-full max-w-sm mx-auto"
      aria-hidden="true"
    >
      {/* Karte hinten */}
      <rect
        x="20" y="30" width="280" height="108" rx="14"
        fill="#F4F4F5" stroke="#E4E4E7" strokeWidth="1.5"
        transform="rotate(-3 160 84)"
      />
      {/* Karte Mitte */}
      <rect
        x="20" y="50" width="280" height="108" rx="14"
        fill="#FAFAFA" stroke="#E4E4E7" strokeWidth="1.5"
        transform="rotate(1.5 160 104)"
      />
      {/* Karte vorne */}
      <rect x="20" y="72" width="280" height="120" rx="14" fill="white" stroke="#E4E4E7" strokeWidth="1.5" />
      {/* Sportfarb-Akzent links */}
      <rect x="20" y="72" width="6" height="120" rx="3" fill="#16A34A" />

      {/* Logo-Kreis */}
      <circle cx="62" cy="132" r="22" fill="#F4F4F5" stroke="#E4E4E7" />
      <rect x="52" y="126" width="20" height="12" rx="3" fill="#D4D4D8" />

      {/* Vereinsinfo */}
      <rect x="96" y="110" width="130" height="12" rx="4" fill="#D4D4D8" />
      <rect x="96" y="128" width="96" height="8" rx="3" fill="#E4E4E7" />
      <rect x="96" y="143" width="74" height="8" rx="3" fill="#DCFCE7" />

      {/* Folgen-Button */}
      <rect x="236" y="112" width="52" height="28" rx="8" fill="#DCFCE7" />
      <rect x="246" y="122" width="32" height="8" rx="3" fill="#16A34A" fillOpacity="0.6" />
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
    <section id="wie-es-funktioniert" className="bg-white py-24 sm:py-32 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <motion.div
          className="text-center mb-20 sm:mb-28"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0A0A0A] tracking-tight">
            In 3 Minuten startklar.
          </h2>
          <p className="mt-4 text-lg text-[#52525B] max-w-md mx-auto">
            Kein Setup. Kein Abo. Einfach loslegen.
          </p>
        </motion.div>

        {/* Schritte */}
        <div className="space-y-24 sm:space-y-32">
          {STEPS.map((step, i) => {
            const isNormal = i % 2 === 0 // 0, 2 → Text links
            const { IllustrationComponent } = step

            return (
              <motion.div
                key={step.number}
                className={`relative flex flex-col ${
                  isNormal ? 'md:flex-row' : 'md:flex-row-reverse'
                } gap-12 md:gap-16 items-center`}
                initial={{ opacity: 0, y: 32 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              >
                {/* Dekorations-Zahl */}
                <span
                  className="absolute -top-10 -left-4 md:-left-8 z-0 font-black leading-none
                             select-none pointer-events-none text-[140px] md:text-[180px]
                             text-[#F4F4F5]"
                  aria-hidden="true"
                >
                  {step.number}
                </span>

                {/* Text-Inhalt */}
                <div className="relative z-10 flex-1 max-w-lg">
                  {/* Badge */}
                  <span className="inline-block bg-[#DCFCE7] text-[#16A34A] text-xs font-semibold px-3 py-1 rounded-full mb-4">
                    {step.badge}
                  </span>

                  <h3 className="text-2xl sm:text-3xl font-bold text-[#0A0A0A] mb-4">
                    {step.title}
                  </h3>
                  <p className="text-base text-[#52525B] leading-relaxed">
                    {step.description}
                  </p>

                  {/* KI-Hinweis (nur Schritt 02) */}
                  {step.aiHint && (
                    <p className="mt-5 text-xs text-[#71717A] bg-[#F4F4F5] border border-[#E4E4E7] rounded-lg px-4 py-2.5 inline-block">
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
