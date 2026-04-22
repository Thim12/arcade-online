'use client'

import { motion } from 'framer-motion'
import { Dumbbell, Brain, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface Step {
  number: string
  title: string
  description: string
  accent: string
  accentBg: string
  borderColor: string
  Icon: LucideIcon
}

const STEPS: Step[] = [
  {
    number: '01',
    title: 'Sportart waehlen',
    description:
      'Fussball, Tennis oder Basketball — waehle deine Sportart und gib dein Profil an. Position, Liga und Leistungsklasse in unter 2 Minuten.',
    accent: 'text-green-700',
    accentBg: 'bg-green-100',
    borderColor: 'border-green-200',
    Icon: Dumbbell,
  },
  {
    number: '02',
    title: 'Trainingsplan erstellen',
    description:
      'Unsere eigene KI erstellt sofort deinen positionsspezifischen Trainingsplan. Verletzungen und Recovery werden automatisch beruecksichtigt.',
    accent: 'text-blue-700',
    accentBg: 'bg-blue-100',
    borderColor: 'border-blue-200',
    Icon: Brain,
  },
  {
    number: '03',
    title: 'Community & Turniere',
    description:
      'Finde den passenden Verein in deiner Naehe, tritt der Community bei und melde dich zu Turnieren an — alles kostenlos.',
    accent: 'text-amber-700',
    accentBg: 'bg-amber-100',
    borderColor: 'border-amber-200',
    Icon: Users,
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.18,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: 'easeOut' },
  },
}

export default function WieEsFunktioniertSection() {
  return (
    <section id="wie-es-funktioniert" className="relative bg-zinc-50 py-28 sm:py-32 overflow-hidden">
      <div className="relative max-w-6xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16 sm:mb-20"
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-zinc-200 text-zinc-600 mb-4">
            So funktioniert&apos;s
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 tracking-tight">
            In 3 Schritten zum<br className="hidden sm:block" /> personalisierten Training
          </h2>
          <p className="mt-4 text-zinc-500 text-lg max-w-md mx-auto">
            Schnell, einfach und kostenlos.
          </p>
        </motion.div>

        <motion.div
          className="relative grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-6"
          variants={containerVariants}
          initial={false}
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <ConnectingLine />

          {STEPS.map((step) => {
            const StepIcon = step.Icon

            return (
              <motion.div
                key={step.number}
                variants={cardVariants}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="relative mb-6">
                  <span
                    className="text-[100px] sm:text-[120px] font-black text-zinc-100 leading-none select-none pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2"
                    aria-hidden="true"
                  >
                    {step.number}
                  </span>
                  <div
                    className={`relative z-10 w-16 h-16 rounded-2xl ${step.accentBg} ${step.borderColor} border flex items-center justify-center`}
                  >
                    <StepIcon className={`w-7 h-7 ${step.accent}`} strokeWidth={2} />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-zinc-900 mb-3 tracking-tight">
                  {step.title}
                </h3>
                <p className="text-zinc-500 text-sm leading-relaxed max-w-xs">
                  {step.description}
                </p>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}

function ConnectingLine(): ReactNode {
  return (
    <div className="hidden lg:flex items-center justify-center absolute top-1/2 left-0 right-0 -translate-y-1/2 pointer-events-none z-0">
      <div className="flex items-center w-full max-w-4xl mx-auto px-12">
        <div className="flex-1 h-px bg-zinc-200" />
        <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 mx-3" />
        <div className="flex-1 h-px bg-zinc-200" />
        <div className="w-2.5 h-2.5 rounded-full bg-zinc-300 mx-3" />
        <div className="flex-1 h-px bg-zinc-200" />
      </div>
    </div>
  )
}