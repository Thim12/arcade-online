'use client'

// ─────────────────────────────────────────────────────────────────
// app/(static)/ueber-uns/page.tsx
//
// Über-uns-Seite mit atmosphärischem Dark-Hero, Mission-Statement,
// KI-Sektion und Coming-Soon-Bereich.
// Design: Nike.com × Spotify × Linear.app × Whoop.com
// ─────────────────────────────────────────────────────────────────

import { motion } from 'framer-motion'
import Link from 'next/link'
import {
  BrainCircuit,
  Clock,
  MapPin,
  Zap,
  Shield,
  Server,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react'
import type { Metadata } from 'next'

// Metadata kann in Client-Komponenten nicht exportiert werden —
// wird via generateMetadata oder separatem server segment behandelt.
// Für die statische Route ist der Root-Layout-Titel ausreichend.

// ── Animation-Varianten ──────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const staggerChildren = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
}

const staggerFast = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07, delayChildren: 0.1 } },
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
}

// ── Daten ────────────────────────────────────────────────────────

const comingSoonSports = [
  'Leichtathletik',
  'Schwimmen',
  'Volleyball',
  'Handball',
  'Badminton',
]

const regions = [
  { name: 'Hessen', status: 'Jetzt verfügbar', active: true },
  { name: 'Nordrhein-Westfalen', status: '2025', active: false },
  { name: 'Bayern', status: '2025', active: false },
  { name: 'Berlin', status: '2025', active: false },
  { name: 'Deutschlandweit', status: '2026', active: false },
]

const aiModules = [
  {
    name: 'TrainingAI',
    description: 'Kennt nur Sport und Trainingsplanung.',
    icon: Zap,
    color: '#16A34A',
  },
  {
    name: 'NutritionAI',
    description: 'Kennt nur Ernährung und Makronährstoffe.',
    icon: Shield,
    color: '#C2621A',
  },
  {
    name: 'VereinAI',
    description: 'Kennt nur Vereine und persönliche Empfehlungen.',
    icon: MapPin,
    color: '#2563EB',
  },
]

// ── Komponente ────────────────────────────────────────────────────

export default function UeberUnsPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-[#FAFAFA] overflow-x-hidden">

      {/* ── Hero: Dark Gradient ──────────────────────────────────── */}
      <section className="relative min-h-[72vh] flex flex-col items-center justify-center overflow-hidden bg-[#0A0A0A]">
        {/* Hintergrund-Gradient: tiefschwarz → dunkelgrün */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(22,163,74,0.18) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, rgba(22,163,74,0.10) 0%, transparent 60%), #0A0A0A',
          }}
        />

        {/* Subtiles Grid-Pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        {/* Grüner Leuchtpunkt oben-mitte */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-[#16A34A]/20 blur-[100px] rounded-full pointer-events-none" />

        <motion.div
          className="relative z-10 flex flex-col items-center text-center px-6 py-24"
          variants={staggerChildren}
          initial="hidden"
          animate="visible"
        >
          {/* Badge */}
          <motion.div variants={fadeInUp}>
            <span className="inline-flex items-center gap-2 bg-white/8 border border-white/12 text-white/60 text-xs font-medium px-4 py-1.5 rounded-full mb-8 backdrop-blur-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80] animate-pulse" />
              Kostenlos seit 2024
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeInUp}
            className="text-5xl md:text-7xl font-black text-white leading-[0.95] tracking-tight mb-6 max-w-4xl"
          >
            SportRise ist
            <br />
            <span
              style={{
                background: 'linear-gradient(135deg, #4ADE80 0%, #16A34A 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              für alle.
            </span>
          </motion.h1>

          {/* Subline */}
          <motion.p
            variants={fadeInUp}
            className="text-xl md:text-2xl text-white/60 font-light tracking-wide"
          >
            Kostenlos. Werbefrei. Für immer.
          </motion.p>

          {/* CTA */}
          <motion.div variants={fadeInUp} className="mt-10">
            <Link
              href="/vereine"
              className="inline-flex items-center gap-2 bg-[#16A34A] hover:bg-[#15803D] text-white px-7 py-3.5 rounded-xl font-semibold text-sm transition-all duration-200"
              style={{ boxShadow: '0 0 32px rgba(22,163,74,0.35)' }}
            >
              Jetzt entdecken
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll-Indikator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
        >
          <div className="flex flex-col items-center gap-1">
            <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/30 to-white/10" />
          </div>
        </motion.div>
      </section>

      {/* ── Mission Statement ─────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <motion.div
          className="max-w-3xl mx-auto text-center"
          variants={staggerChildren}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
        >
          <motion.p
            variants={fadeInUp}
            className="text-xs font-semibold text-[#16A34A] uppercase tracking-[0.2em] mb-6"
          >
            Unsere Mission
          </motion.p>
          <motion.p
            variants={fadeInUp}
            className="text-xl md:text-2xl text-[#52525B] leading-relaxed font-light"
          >
            Sport soll keine Frage des Geldbeutels sein.{' '}
            <span className="text-[#0A0A0A] font-medium">
              SportRise gibt jedem Jugendlichen in Deutschland — unabhängig von
              Herkunft oder Budget —
            </span>{' '}
            Zugang zu professioneller Trainingsplanung, echten Vereinsempfehlungen
            und einer motivierenden Community.
          </motion.p>
        </motion.div>
      </section>

      {/* ── Drei Kernpunkte ───────────────────────────────────────── */}
      <section className="py-12 px-6 bg-[#FAFAFA]">
        <motion.div
          className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={staggerChildren}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {[
            {
              label: '100%',
              sub: 'Kostenlos',
              desc: 'Keine versteckten Kosten. Kein Freemium. Keine Werbung.',
              color: '#16A34A',
            },
            {
              label: '0',
              sub: 'Werbepartner',
              desc: 'Keine Nutzerprofile für Werbezwecke. Niemals.',
              color: '#EA580C',
            },
            {
              label: 'EU',
              sub: 'Server Frankfurt',
              desc: 'Alle Daten in Deutschland. DSGVO by Design.',
              color: '#2563EB',
            },
          ].map((item) => (
            <motion.div
              key={item.label}
              variants={fadeInUp}
              className="bg-white border border-[#E4E4E7] rounded-2xl p-8 group hover:-translate-y-1 transition-transform duration-300"
              style={{
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              }}
            >
              <p
                className="text-4xl font-black mb-1"
                style={{ color: item.color }}
              >
                {item.label}
              </p>
              <p className="text-sm font-semibold text-[#0A0A0A] mb-3">{item.sub}</p>
              <p className="text-sm text-[#71717A] leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Eigene KI-Sektion ─────────────────────────────────────── */}
      <section className="py-24 px-6 bg-[#0A0A0A] overflow-hidden">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
          >
            {/* Header */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col md:flex-row md:items-start gap-5 mb-14"
            >
              <div className="w-14 h-14 bg-[#16A34A]/15 border border-[#16A34A]/30 rounded-2xl flex items-center justify-center flex-shrink-0">
                <BrainCircuit className="w-7 h-7 text-[#16A34A]" />
              </div>
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
                  Unsere eigene KI —<br />
                  <span className="text-[#4ADE80]">kein externer Bot.</span>
                </h2>
                <p className="text-[#A1A1AA] text-base leading-relaxed max-w-2xl">
                  Alle KI-Features wurden von Grund auf als eigene TypeScript-Klassen
                  entwickelt. Kein Langchain. Kein AutoGPT. Kein fremdes Agenten-Framework.
                  Das hat drei entscheidende Vorteile:
                </p>
              </div>
            </motion.div>

            {/* Drei Vorteile */}
            <motion.div
              variants={staggerChildren}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14"
            >
              {[
                {
                  icon: Shield,
                  title: '100% DSGVO-konform',
                  desc: 'Keine Nutzerdaten verlassen unsere Server. Kein US-Drittanbieter sieht dein Training.',
                  color: '#16A34A',
                },
                {
                  icon: Zap,
                  title: 'Deutlich günstiger',
                  desc: 'Direkte API-Calls statt teurer Agenten-Layer. Günstigere Infrastruktur — kostenlos für dich.',
                  color: '#C2621A',
                },
                {
                  icon: BrainCircuit,
                  title: 'Höhere Qualität',
                  desc: 'Jede KI-Klasse ist auf ihre Aufgabe zugeschnitten. Fokus statt Generalisten-Rauschen.',
                  color: '#2563EB',
                },
              ].map((item) => (
                <motion.div
                  key={item.title}
                  variants={fadeInUp}
                  className="bg-white/5 border border-white/8 rounded-2xl p-6 backdrop-blur-sm"
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-4"
                    style={{ backgroundColor: `${item.color}22` }}
                  >
                    <item.icon className="w-4.5 h-4.5" style={{ color: item.color }} />
                  </div>
                  <p className="text-white font-semibold text-sm mb-2">{item.title}</p>
                  <p className="text-[#71717A] text-sm leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* KI-Module */}
            <motion.div variants={fadeInUp}>
              <p className="text-xs font-semibold text-[#52525B] uppercase tracking-wider mb-4">
                Spezialisierte Module
              </p>
              <div className="flex flex-wrap gap-3">
                {aiModules.map((mod) => (
                  <div
                    key={mod.name}
                    className="flex items-center gap-2.5 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5"
                  >
                    <mod.icon className="w-4 h-4 flex-shrink-0" style={{ color: mod.color }} />
                    <div>
                      <p className="text-white text-xs font-semibold leading-none mb-0.5">
                        {mod.name}
                      </p>
                      <p className="text-[#71717A] text-xs">{mod.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* DSGVO-Badge */}
            <motion.p
              variants={fadeIn}
              className="mt-10 text-xs text-[#52525B] text-center border-t border-white/8 pt-6"
            >
              Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ── Coming Soon ───────────────────────────────────────────── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <motion.div
            variants={staggerChildren}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
          >
            <motion.div variants={fadeInUp} className="text-center mb-14">
              <p className="text-xs font-semibold text-[#71717A] uppercase tracking-[0.2em] mb-3">
                Roadmap
              </p>
              <h2 className="text-3xl md:text-4xl font-bold text-[#0A0A0A]">
                Was noch kommt.
              </h2>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Neue Sportarten */}
              <motion.div variants={fadeInUp}>
                <p className="text-sm font-semibold text-[#0A0A0A] mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                  Neue Sportarten
                </p>
                <motion.div
                  className="flex flex-wrap gap-2"
                  variants={staggerFast}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                >
                  {/* Aktive Sportarten */}
                  {['Fußball', 'Tennis', 'Basketball'].map((sport) => (
                    <motion.span
                      key={sport}
                      variants={fadeInUp}
                      className="inline-flex items-center gap-1.5 bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] text-xs font-medium px-3 py-1.5 rounded-full"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      {sport}
                    </motion.span>
                  ))}
                  {/* Coming Soon Sportarten */}
                  {comingSoonSports.map((sport) => (
                    <motion.span
                      key={sport}
                      variants={fadeInUp}
                      className="inline-flex items-center gap-1.5 bg-[#F4F4F5] border border-[#E4E4E7] text-[#71717A] text-xs font-medium px-3 py-1.5 rounded-full"
                    >
                      <Clock className="w-3 h-3" />
                      {sport}
                    </motion.span>
                  ))}
                </motion.div>
              </motion.div>

              {/* Neue Regionen */}
              <motion.div variants={fadeInUp}>
                <p className="text-sm font-semibold text-[#0A0A0A] mb-5 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
                  Neue Regionen
                </p>
                <div className="space-y-2">
                  {regions.map((region) => (
                    <div
                      key={region.name}
                      className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                        region.active
                          ? 'bg-[#F0FDF4] border-[#BBF7D0]'
                          : 'bg-[#FAFAFA] border-[#E4E4E7]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {region.active ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-[#A1A1AA]" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            region.active ? 'text-[#16A34A]' : 'text-[#3F3F46]'
                          }`}
                        >
                          {region.name}
                        </span>
                      </div>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          region.active
                            ? 'bg-[#16A34A] text-white'
                            : 'bg-[#E4E4E7] text-[#71717A]'
                        }`}
                      >
                        {region.status}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Technik-Footer ────────────────────────────────────────── */}
      <section className="py-10 px-6 bg-[#FAFAFA] border-t border-[#E4E4E7]">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1">
            {[
              { icon: Shield, text: 'DSGVO-konform' },
              { icon: Server, text: 'Supabase EU Frankfurt' },
              { icon: BrainCircuit, text: 'Eigene KI' },
              { icon: Zap, text: 'Kein Tracking' },
            ].map((item) => (
              <span
                key={item.text}
                className="flex items-center gap-1.5 text-xs text-[#A1A1AA]"
              >
                <item.icon className="w-3 h-3" />
                {item.text}
              </span>
            ))}
          </div>
          <Link
            href="/faq"
            className="text-xs text-[#71717A] hover:text-[#16A34A] transition-colors flex items-center gap-1"
          >
            Häufige Fragen
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </section>
    </main>
  )
}
