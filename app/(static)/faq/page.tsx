'use client'

// ─────────────────────────────────────────────────────────────────
// app/(static)/faq/page.tsx
//
// FAQ-Seite mit Radix UI Accordion (direkt, kein shadcn/ui).
// Tracked welche Items geöffnet wurden (nie gelöscht aus dem Set).
// Wenn alle 22 Fragen mindestens einmal geöffnet wurden:
// → POST /api/easter-egg/all-faq-opened → Badge "Stiller Leser" + 200 XP
//
// Der Easter-Egg-Call passiert stilles — kein Toast bis das Badge
// vom XP-System über den CustomEvent 'xp-gained' angezeigt wird.
// ─────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'
import * as Accordion from '@radix-ui/react-accordion'
import { motion } from 'framer-motion'
import { useSession } from 'next-auth/react'
import { ChevronDown, MessageCircleQuestion } from 'lucide-react'
import Link from 'next/link'

// ── FAQ-Daten ─────────────────────────────────────────────────────

interface FaqItem {
  id: string
  question: string
  answer: React.ReactNode
  category: 'allgemein' | 'sport' | 'ki' | 'datenschutz' | 'konto' | 'easter'
}

const FAQ_ITEMS: FaqItem[] = [
  // ── Allgemein
  {
    id: 'kosten',
    category: 'allgemein',
    question: 'Was kostet SportRise?',
    answer: (
      <p>
        Nichts. SportRise ist komplett kostenlos — heute, morgen und für immer. Kein Freemium,
        keine Premium-Stufe, keine Werbung. SportRise ist und bleibt eine werbefreie Plattform.
      </p>
    ),
  },
  {
    id: 'nur-jugendliche',
    category: 'allgemein',
    question: 'Ist SportRise nur für Jugendliche?',
    answer: (
      <p>
        Nein. SportRise richtet sich an alle Altersklassen. Jugendliche und Amateursportler sind
        die Kernzielgruppe, aber jeder der Sport treibt oder einen Verein sucht ist willkommen.
        Mindestalter: 6 Jahre.
      </p>
    ),
  },
  {
    id: 'verfuegbarkeit',
    category: 'allgemein',
    question: 'Wo ist SportRise verfügbar?',
    answer: (
      <p>
        Aktuell ist SportRise in <strong>Hessen</strong> verfügbar — mit vollständigen
        Vereinsdaten, Turnierverwaltung und Community. Die Erweiterung auf Nordrhein-Westfalen
        und Bayern ist für 2025 geplant. Deutschlandweit bis 2026.
      </p>
    ),
  },
  {
    id: 'sportarten',
    category: 'sport',
    question: 'Welche Sportarten gibt es?',
    answer: (
      <div>
        <p className="mb-2">Aktuell vollständig unterstützt:</p>
        <ul className="list-disc pl-4 space-y-1">
          <li>
            <strong>Fußball</strong> — Vereinsfinder, Trainingspläne, Turniere, DTB-Ranglisten
          </li>
          <li>
            <strong>Tennis</strong> — LK-System, Platzsuche, KI-Trainingsplan
          </li>
          <li>
            <strong>Basketball</strong> — Teamfinder, Trainingspläne, Ligasystem
          </li>
        </ul>
        <p className="mt-2 text-[#71717A] text-sm">
          Leichtathletik, Schwimmen, Volleyball, Handball und Badminton folgen bald.
        </p>
      </div>
    ),
  },
  {
    id: 'lk-system',
    category: 'sport',
    question: 'Was ist das LK-System bei Tennis?',
    answer: (
      <p>
        Das LK-System (Leistungsklassen-System) ist das offizielle Ranking des Deutschen
        Tennis Bundes (DTB). Die Skala reicht von LK 23 (Anfänger) bis LK 1 (Spitzenklasse).
        Je niedriger die Zahl, desto besser der Spieler. Auf SportRise kannst du deine LK
        eintragen und findest automatisch Gegner auf deinem Niveau.
      </p>
    ),
  },
  {
    id: 'vereinsfinder',
    category: 'sport',
    question: 'Wie funktioniert der Vereinsfinder?',
    answer: (
      <p>
        Der Vereinsfinder kombiniert einen eigenen Scoring-Algorithmus mit KI-Empfehlungen.
        Dein Profil (Sportart, Level, Wohnort, Ziele) wird mit verifizierten Vereinsdaten
        abgeglichen. Die KI begründet dann in einem kurzen Text, warum ein bestimmter
        Verein zu dir passt — ohne externe Drittanbieter.
      </p>
    ),
  },
  {
    id: 'turniere',
    category: 'sport',
    question: 'Wie funktionieren Turniere?',
    answer: (
      <p>
        Vereine oder private Organisatoren können Turniere direkt auf SportRise erstellen
        und veröffentlichen. Du kannst dich mit einem Klick anmelden. Vor dem Turnier-Start
        erhältst du automatisch eine Erinnerungs-E-Mail. Ergebnisse werden nach dem Turnier
        eingetragen und fließen in dein Profil und die Rangliste ein.
      </p>
    ),
  },
  // ── KI
  {
    id: 'ki-echt',
    category: 'ki',
    question: 'Ist die KI auf SportRise eine echte KI oder ein Bot?',
    answer: (
      <div>
        <p className="mb-2">
          SportRise nutzt eine <strong>selbst entwickelte KI-Engine</strong> aus spezialisierten
          TypeScript-Klassen. Kein externer Dienst, kein Langchain, kein AutoGPT.
        </p>
        <p className="text-sm bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-3 text-[#16A34A] font-medium">
          Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform
        </p>
      </div>
    ),
  },
  {
    id: 'trainingsplan',
    category: 'ki',
    question: 'Wie erstelle ich einen KI-Trainingsplan?',
    answer: (
      <p>
        Nach dem Onboarding wählst du deine Sportart, dein Level, deine Ziele und die
        verfügbaren Trainingstage pro Woche aus. Die TrainingAI erstellt dann automatisch
        einen personalisierten Wochenplan. Du kannst jeden Plan anpassen und neu generieren.
      </p>
    ),
  },
  // ── Datenschutz
  {
    id: 'dsgvo',
    category: 'datenschutz',
    question: 'Ist SportRise DSGVO-konform?',
    answer: (
      <p>
        Ja. Alle Daten werden ausschließlich auf EU-Servern in Frankfurt am Main
        (Supabase, aws-0-eu-central-1) gespeichert. SportRise nutzt keine US-Cloud-Dienste
        für personenbezogene Daten, kein Google Analytics, keine Tracking-Cookies. Mehr
        dazu in der{' '}
        <Link href="/datenschutz" className="text-[#16A34A] underline underline-offset-2">
          Datenschutzerklärung
        </Link>
        .
      </p>
    ),
  },
  {
    id: 'kein-analytics',
    category: 'datenschutz',
    question: 'Warum kein Google Analytics?',
    answer: (
      <p>
        Google Analytics überträgt Nutzerdaten an US-Server — nicht DSGVO-konform ohne
        ausdrückliche Einwilligung. SportRise nutzt stattdessen Vercel Analytics: vollständig
        anonym, cookie-frei und mit Servern in der EU. Keine Nutzerprofile, kein Tracking.
      </p>
    ),
  },
  {
    id: 'daten-loeschen',
    category: 'datenschutz',
    question: 'Kann ich meine Daten löschen?',
    answer: (
      <p>
        Ja, jederzeit. Unter{' '}
        <span className="text-[#0A0A0A] font-medium">
          Profil → Einstellungen → Konto löschen
        </span>{' '}
        kannst du dein Konto und alle zugehörigen Daten sofort löschen. Die vollständige
        Löschung aus unseren Backups erfolgt innerhalb von 30 Tagen. Du kannst auch eine
        Kopie deiner Daten als JSON exportieren (Art. 20 DSGVO).
      </p>
    ),
  },
  {
    id: 'mindestalter',
    category: 'datenschutz',
    question: 'Was gilt für Kinder unter 13 Jahren?',
    answer: (
      <p>
        Nutzer unter 13 Jahren benötigen die ausdrückliche Einwilligung eines
        Erziehungsberechtigten (Art. 8 DSGVO, § 8 BDSG). Bei der Registrierung erfassen
        wir das Geburtsdatum. Stellt sich heraus, dass ein Kind unter 13 Jahren ohne
        elterliche Einwilligung registriert ist, wird das Konto gesperrt und alle Daten
        werden gelöscht. Eltern können die Löschung jederzeit per E-Mail an
        datenschutz@sportrise.de beantragen.
      </p>
    ),
  },
  // ── Konto
  {
    id: 'anmeldung',
    category: 'konto',
    question: 'Wie melde ich mich an?',
    answer: (
      <p>
        Du kannst dich per <strong>Google-Konto</strong> (ein Klick) oder mit
        <strong> E-Mail und Passwort</strong> registrieren. Das Passwort wird als
        Bcrypt-Hash gespeichert — niemand kann es im Klartext lesen, auch wir nicht.
      </p>
    ),
  },
  {
    id: 'mehrere-konten',
    category: 'konto',
    question: 'Kann ich mehrere Konten anlegen?',
    answer: (
      <p>
        Nein. Pro Person ist ein Konto erlaubt. Mehrfachkonten zur Manipulation von
        Ranglisten oder XP-System verstoßen gegen unsere AGB und führen zur Sperrung
        aller betroffenen Konten.
      </p>
    ),
  },
  {
    id: 'xp-system',
    category: 'konto',
    question: 'Wie verdiene ich XP?',
    answer: (
      <div>
        <p className="mb-2">XP erhältst du für verschiedene Aktivitäten:</p>
        <ul className="list-disc pl-4 space-y-1 text-sm">
          <li>Training abschließen: +25 XP</li>
          <li>Trainingsplan erstellen: +15 XP</li>
          <li>An Turnier teilnehmen: +50 XP</li>
          <li>Community-Beitrag verfassen: +10 XP</li>
          <li>Tages-Streak aufrechterhalten: +5 XP/Tag</li>
          <li>Profil vollständig ausfüllen: +20 XP</li>
          <li>Abzeichen verdienen: variiert</li>
        </ul>
      </div>
    ),
  },
  {
    id: 'abzeichen',
    category: 'konto',
    question: 'Was sind Abzeichen?',
    answer: (
      <p>
        Abzeichen (Badges) werden für besondere Leistungen vergeben — z.B. 30-Tage-Streak,
        erstes Turnier, KI-Plan-Meister oder seltene Community-Aktivitäten. Es gibt vier
        Seltenheitsstufen: Gewöhnlich, Selten, Episch und Legendär. Manche Abzeichen
        sind Easter Eggs und werden nicht offiziell angekündigt.
      </p>
    ),
  },
  {
    id: 'sparring',
    category: 'konto',
    question: 'Was ist der Sparring-Finder?',
    answer: (
      <p>
        Der Sparring-Finder hilft dir, Trainingspartner auf deinem Niveau zu finden.
        Du kannst Anfragen senden, Zeitslots vorschlagen und euch auf einem Sportplatz
        in deiner Nähe verabreden. Alles ohne E-Mail-Austausch — direkt auf der Plattform.
      </p>
    ),
  },
  {
    id: 'verein-eintragen',
    category: 'konto',
    question: 'Kann ich meinen Verein bei SportRise eintragen?',
    answer: (
      <p>
        Ja. Über den Bereich "Verein einreichen" kannst du deinen Verein zur Prüfung
        einreichen. Das SportRise-Team verifiziert den Eintrag und schaltet ihn frei.
        Verifizierte Vereine erscheinen im Vereinsfinder mit einem Vertrauens-Badge.
      </p>
    ),
  },
  {
    id: 'browser',
    category: 'allgemein',
    question: 'Welche Browser werden unterstützt?',
    answer: (
      <p>
        SportRise funktioniert in allen modernen Browsern: Chrome, Firefox, Safari, Edge.
        JavaScript muss aktiviert sein. Mobile Browser (iOS Safari, Chrome Android) sind
        vollständig unterstützt — die Seite ist Mobile-First entwickelt.
      </p>
    ),
  },
  {
    id: 'app',
    category: 'allgemein',
    question: 'Gibt es eine App?',
    answer: (
      <p>
        Noch nicht als native App. SportRise ist als Progressive Web App (PWA) konzipiert:
        Du kannst die Seite auf dem Homescreen deines Smartphones speichern und wie eine
        App nutzen. Eine native iOS/Android-App ist auf der Roadmap für 2026.
      </p>
    ),
  },
  // ── Easter Egg
  {
    id: 'easter-eggs',
    category: 'easter',
    question: 'Was sind Easter Eggs?',
    answer: (
      <p>
        Manche Dinge werden nicht verraten.
      </p>
    ),
  },
]

// Kategorie-Labels
const CATEGORY_LABELS: Record<FaqItem['category'], string> = {
  allgemein: 'Allgemein',
  sport: 'Sport & Vereine',
  ki: 'Künstliche Intelligenz',
  datenschutz: 'Datenschutz & DSGVO',
  konto: 'Konto & Funktionen',
  easter: 'Sonstiges',
}

// ── Animation-Varianten ──────────────────────────────────────────

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
}

const staggerChildren = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
}

// ── Komponente ────────────────────────────────────────────────────

export default function FaqPage(): React.JSX.Element {
  const { data: session } = useSession()

  // Set der Items die mindestens einmal geöffnet wurden (wächst nur)
  const [openedOnce, setOpenedOnce] = useState<Set<string>>(new Set())
  // Derzeit offene Items (Accordion-State)
  const [openValues, setOpenValues] = useState<string[]>([])

  // Easter-Egg darf nur einmal pro Session ausgelöst werden
  const easterEggFired = useRef(false)
  // Aktiver Kategorie-Filter (leer = alle)
  const [activeCategory, setActiveCategory] = useState<FaqItem['category'] | 'alle'>('alle')

  // ── Item-Open-Tracking ───────────────────────────────────────
  const handleValueChange = useCallback((values: string[]) => {
    setOpenValues(values)
    setOpenedOnce((prev) => {
      if (values.length === 0) return prev
      const next = new Set(prev)
      values.forEach((v) => next.add(v))
      return next
    })
  }, [])

  // ── Easter-Egg-Trigger ───────────────────────────────────────
  useEffect(() => {
    const allIds = FAQ_ITEMS.map((item) => item.id)
    const allOpened = allIds.every((id) => openedOnce.has(id))

    if (allOpened && !easterEggFired.current) {
      easterEggFired.current = true

      // Nur ausführen wenn eingeloggt — sonst stille Ablehnung vom Server
      if (!session?.user) return

      fetch('/api/easter-egg/all-faq-opened', { method: 'POST' })
        .then((res) => res.json())
        .then((data: { xpAwarded?: number }) => {
          // XP-Animation über globalen CustomEvent auslösen
          if (data.xpAwarded && data.xpAwarded > 0) {
            window.dispatchEvent(
              new CustomEvent('xp-gained', {
                detail: { amount: data.xpAwarded, reason: 'Alle FAQ gelesen' },
              }),
            )
          }
        })
        .catch(() => {
          // Easter-Egg-Fehler dürfen niemals im UI sichtbar werden
        })
    }
  }, [openedOnce, session?.user])

  // ── Gefilterte Items ─────────────────────────────────────────
  const filteredItems =
    activeCategory === 'alle'
      ? FAQ_ITEMS
      : FAQ_ITEMS.filter((item) => item.category === activeCategory)

  const categories = ['alle', ...Object.keys(CATEGORY_LABELS)] as Array<
    FaqItem['category'] | 'alle'
  >

  return (
    <main className="min-h-screen bg-[#FAFAFA] py-16 px-4">
      <div className="max-w-3xl mx-auto">

        {/* ── Header ──────────────────────────────────────────── */}
        <motion.div
          className="mb-12"
          initial="hidden"
          animate="visible"
          variants={staggerChildren}
        >
          <motion.div variants={fadeInUp} className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-[#0A0A0A] rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageCircleQuestion className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-[#0A0A0A]">Häufige Fragen</h1>
          </motion.div>
          <motion.p variants={fadeInUp} className="text-[#71717A] ml-[52px]">
            {FAQ_ITEMS.length} Fragen und Antworten zu SportRise.
          </motion.p>
        </motion.div>

        {/* ── Kategorie-Filter ─────────────────────────────────── */}
        <motion.div
          className="flex flex-wrap gap-2 mb-8"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`text-xs font-medium px-3.5 py-1.5 rounded-full border transition-all duration-200 ${
                activeCategory === cat
                  ? 'bg-[#0A0A0A] text-white border-[#0A0A0A]'
                  : 'bg-white text-[#52525B] border-[#E4E4E7] hover:border-[#A1A1AA]'
              }`}
            >
              {cat === 'alle' ? 'Alle' : CATEGORY_LABELS[cat as FaqItem['category']]}
            </button>
          ))}
        </motion.div>

        {/* ── Accordion ────────────────────────────────────────── */}
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Accordion.Root
            type="multiple"
            value={openValues}
            onValueChange={handleValueChange}
            className="space-y-2"
          >
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04, ease: [0.22, 1, 0.36, 1] }}
              >
                <Accordion.Item
                  value={item.id}
                  className="bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden transition-shadow duration-200 hover:shadow-sm data-[state=open]:border-[#D4D4D8]"
                >
                  <Accordion.Header className="flex">
                    <Accordion.Trigger className="flex-1 flex items-center justify-between px-5 py-4 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A] focus-visible:ring-offset-1 rounded-2xl">
                      <span className="text-sm font-medium text-[#0A0A0A] group-data-[state=open]:text-[#16A34A] transition-colors duration-200 pr-4">
                        {item.question}
                      </span>
                      <ChevronDown
                        className="w-4 h-4 text-[#A1A1AA] flex-shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.87,0,0.13,1)] group-data-[state=open]:rotate-180 group-data-[state=open]:text-[#16A34A]"
                        aria-hidden
                      />
                    </Accordion.Trigger>
                  </Accordion.Header>

                  <Accordion.Content className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                    <div className="px-5 pb-5 text-sm text-[#52525B] leading-relaxed border-t border-[#F4F4F5] pt-4">
                      {item.answer}
                    </div>
                  </Accordion.Content>
                </Accordion.Item>
              </motion.div>
            ))}
          </Accordion.Root>
        </motion.div>

        {/* ── Fortschritts-Anzeige (für Entdecker) ────────────── */}
        {openedOnce.size > 0 && openedOnce.size < FAQ_ITEMS.length && (
          <motion.div
            className="mt-8 flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex-1 h-1 bg-[#E4E4E7] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#16A34A] rounded-full transition-all duration-500"
                style={{ width: `${(openedOnce.size / FAQ_ITEMS.length) * 100}%` }}
              />
            </div>
            <span className="text-xs text-[#A1A1AA] flex-shrink-0">
              {openedOnce.size}/{FAQ_ITEMS.length} gelesen
            </span>
          </motion.div>
        )}

        {/* ── Footer-Links ──────────────────────────────────────── */}
        <div className="mt-16 pt-8 border-t border-[#E4E4E7] flex flex-wrap gap-4 text-sm text-[#71717A]">
          <Link href="/ueber-uns" className="hover:text-[#16A34A] transition-colors">
            Über uns
          </Link>
          <Link href="/datenschutz" className="hover:text-[#16A34A] transition-colors">
            Datenschutz
          </Link>
          <Link href="/impressum" className="hover:text-[#16A34A] transition-colors">
            Impressum
          </Link>
          <Link href="/" className="hover:text-[#16A34A] transition-colors">
            Zur Startseite
          </Link>
        </div>
      </div>
    </main>
  )
}
