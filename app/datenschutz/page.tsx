import type { Metadata } from 'next'
import Link from 'next/link'
import { Shield } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Datenschutzerklärung',
  description: 'Datenschutzerklärung von SportRise — DSGVO-konform.',
}

interface Section {
  id: string
  title: string
  content: React.ReactNode
}

const sections: Section[] = [
  {
    id: 'verantwortlicher',
    title: '1. Verantwortlicher',
    content: (
      <p>
        Verantwortlich im Sinne der DSGVO für die Verarbeitung personenbezogener Daten auf dieser
        Plattform ist das SportRise-Team (Kontaktdaten siehe{' '}
        <Link href="/impressum" className="text-[#16A34A] underline underline-offset-2">
          Impressum
        </Link>
        ).
      </p>
    ),
  },
  {
    id: 'grundsaetze',
    title: '2. Grundsätze der Datenverarbeitung',
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>Wir erheben nur Daten, die für den Betrieb der Plattform zwingend erforderlich sind.</li>
        <li>SportRise zeigt keine Werbung und gibt keine Daten an Werbenetzwerke weiter.</li>
        <li>Alle Datenbankserver befinden sich ausschließlich in der EU (Frankfurt am Main).</li>
        <li>
          Minderjährige unter 13 Jahren dürfen die Plattform nur mit Einwilligung eines
          Erziehungsberechtigten nutzen.
        </li>
      </ul>
    ),
  },
  {
    id: 'hosting',
    title: '3. Hosting & Infrastruktur',
    content: (
      <>
        <p className="mb-2">
          <strong>Vercel Inc.</strong> — Hosting der Next.js-Anwendung (Server-Region: Frankfurt).
          Vercel verarbeitet technische Zugriffsdaten (IP-Adresse, User-Agent) zur Auslieferung der
          Seite. Datenschutzerklärung: vercel.com/legal/privacy-policy.
        </p>
        <p>
          <strong>Supabase Inc.</strong> — Datenbank &amp; Authentifizierung (Region: eu-central-1,
          Frankfurt). Alle Nutzer- und Aktivitätsdaten werden in der EU gespeichert.
          Datenschutzerklärung: supabase.com/privacy.
        </p>
      </>
    ),
  },
  {
    id: 'registrierung',
    title: '4. Registrierung & Authentifizierung',
    content: (
      <>
        <p className="mb-2">
          <strong>Google OAuth (Google LLC)</strong> — Wir bieten die Anmeldung über Google-Konten
          an. Dabei übermittelt Google folgende Daten: Name, E-Mail-Adresse, Profilbild-URL. Diese
          Daten werden in unserer Datenbank gespeichert. Rechtsgrundlage: Art. 6 Abs. 1 lit. b
          DSGVO (Vertragserfüllung).
        </p>
        <p>
          <strong>E-Mail-Registrierung</strong> — Alternativ können sich Nutzer mit E-Mail und
          Passwort registrieren. Das Passwort wird ausschließlich als Bcrypt-Hash gespeichert.
        </p>
      </>
    ),
  },
  {
    id: 'nutzerdaten',
    title: '5. Erhobene Nutzerdaten',
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Pflichtdaten:</strong> E-Mail-Adresse, Benutzername, Geburtsdatum (für
          Altersprüfung)
        </li>
        <li>
          <strong>Freiwillige Angaben:</strong> Profilbild, Sportarten, Vereinszugehörigkeit,
          Wohnort (nur Bundesland/Landkreis)
        </li>
        <li>
          <strong>Aktivitätsdaten:</strong> Trainingseinträge, Turnierteilnahmen, XP-Punkte,
          Abzeichen
        </li>
        <li>
          <strong>Technische Daten:</strong> Sitzungsinformationen (JWT-Token), Geräteart
          (Browser-Agent für optimale Darstellung)
        </li>
      </ul>
    ),
  },
  {
    id: 'ki',
    title: '6. KI-Trainingsplanung',
    content: (
      <>
        <p className="mb-2">
          SportRise nutzt eine <strong>selbst entwickelte KI-Engine</strong> (TypeScript,
          serverseitig in /lib/ai/), die ausschließlich auf SportRise-Servern läuft. Es werden keine
          Nutzerdaten an externe KI-Dienste wie OpenAI, Google Gemini oder Anthropic Claude
          weitergegeben.
        </p>
        <p className="text-sm text-[#71717A] bg-[#F0FDF4] border border-[#BBF7D0] rounded-lg p-3">
          Im UI ist immer sichtbar: &quot;Erstellt von unserer eigenen KI · kein externer Bot ·
          DSGVO-konform&quot;
        </p>
      </>
    ),
  },
  {
    id: 'e-mail',
    title: '7. E-Mail-Versand (Resend)',
    content: (
      <p>
        Für den Versand von Bestätigungs- und Benachrichtigungs-E-Mails nutzen wir{' '}
        <strong>Resend Inc.</strong> Dabei wird die E-Mail-Adresse des Empfängers an Resend
        übermittelt. Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO. Datenschutzerklärung:
        resend.com/privacy.
      </p>
    ),
  },
  {
    id: 'analytics',
    title: '8. Vercel Analytics & Speed Insights',
    content: (
      <p>
        Wir nutzen <strong>Vercel Analytics</strong> und <strong>Vercel Speed Insights</strong> zur
        anonymisierten Messung von Seitenaufrufen und Performance-Metriken. Diese Tools verwenden
        keine Cookies und erfassen keine personenbezogenen Daten. Die Daten werden aggregiert und
        ohne Personenbezug gespeichert. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes
        Interesse an der Plattformoptimierung).
      </p>
    ),
  },
  {
    id: 'cookies',
    title: '9. Cookies & lokale Speicherung',
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Session-Cookie (next-auth.session-token):</strong> Technisch notwendig für die
          Anmeldung. Laufzeit: 30 Tage (oder bis zum Abmelden).
        </li>
        <li>
          <strong>CSRF-Token:</strong> Sicherheits-Cookie für Formulareingaben. Sitzungsgebunden.
        </li>
        <li>Es werden keine Tracking- oder Werbe-Cookies eingesetzt.</li>
      </ul>
    ),
  },
  {
    id: 'jugendschutz',
    title: '10. Jugendschutz & Altersprüfung',
    content: (
      <>
        <p className="mb-2">
          SportRise richtet sich an Nutzer ab 6 Jahren. Bei der Registrierung wird das Geburtsdatum
          erhoben, um den Zugang zu altersunangemessenen Inhalten zu beschränken. Nutzer unter 13
          Jahren benötigen die nachweisliche Einwilligung eines Erziehungsberechtigten (§ 8 DSGVO,
          Art. 8 DSGVO).
        </p>
        <p>
          Stellt SportRise fest, dass ein Nutzer unter 13 Jahren ohne elterliche Einwilligung
          registriert ist, wird das Konto unverzüglich gesperrt und alle erhobenen Daten gelöscht.
        </p>
      </>
    ),
  },
  {
    id: 'rechte',
    title: '11. Deine Rechte (Art. 15–22 DSGVO)',
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>
          <strong>Auskunft (Art. 15):</strong> Du kannst jederzeit Auskunft über die zu dir
          gespeicherten Daten verlangen.
        </li>
        <li>
          <strong>Berichtigung (Art. 16):</strong> Du kannst unrichtige Daten korrigieren lassen.
        </li>
        <li>
          <strong>Löschung (Art. 17):</strong> Du kannst die Löschung deines Kontos und aller
          zugehörigen Daten beantragen — direkt in den Profileinstellungen oder per E-Mail.
        </li>
        <li>
          <strong>Einschränkung (Art. 18):</strong> Du kannst die Verarbeitung einschränken lassen.
        </li>
        <li>
          <strong>Datenübertragbarkeit (Art. 20):</strong> Du kannst einen Export deiner Daten im
          JSON-Format anfordern.
        </li>
        <li>
          <strong>Widerspruch (Art. 21):</strong> Du kannst der Verarbeitung auf Basis berechtigter
          Interessen widersprechen.
        </li>
        <li>
          <strong>Beschwerde:</strong> Du hast das Recht, dich bei der zuständigen
          Datenschutzaufsichtsbehörde (z. B. HBDI Hessen) zu beschweren.
        </li>
      </ul>
    ),
  },
  {
    id: 'speicherdauer',
    title: '12. Speicherdauer',
    content: (
      <ul className="list-disc pl-5 space-y-1">
        <li>
          Kontodaten werden gespeichert, solange das Konto aktiv ist. Nach Löschung: sofortige
          Anonymisierung, vollständige Löschung nach 30 Tagen.
        </li>
        <li>Server-Logs: max. 7 Tage (technisch notwendig).</li>
        <li>E-Mail-Versandprotokolle: 30 Tage.</li>
      </ul>
    ),
  },
  {
    id: 'aenderungen',
    title: '13. Änderungen dieser Erklärung',
    content: (
      <p>
        Bei wesentlichen Änderungen werden angemeldete Nutzer per E-Mail informiert. Die
        aktuellste Version ist immer unter sportrise.de/datenschutz abrufbar. Stand: April 2026.
      </p>
    ),
  },
  {
    id: 'kontakt',
    title: '14. Kontakt Datenschutz',
    content: (
      <p>
        Bei Fragen zum Datenschutz wende dich bitte per E-Mail an:{' '}
        <a
          href="mailto:datenschutz@sportrise.de"
          className="text-[#16A34A] underline underline-offset-2"
        >
          datenschutz@sportrise.de
        </a>
      </p>
    ),
  },
]

export default function DatenschutzPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-[#FAFAFA] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#16A34A] rounded-xl flex items-center justify-center flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#0A0A0A]">Datenschutzerklärung</h1>
        </div>
        <p className="text-[#71717A] mb-10 ml-[52px]">
          Gültig ab April 2026 · DSGVO-konform · EU-Server (Frankfurt)
        </p>

        {/* Table of contents */}
        <nav className="bg-white border border-[#E4E4E7] rounded-2xl p-6 mb-10">
          <p className="text-sm font-semibold text-[#52525B] uppercase tracking-wider mb-3">
            Inhaltsverzeichnis
          </p>
          <ol className="space-y-1">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="text-sm text-[#16A34A] hover:underline underline-offset-2"
                >
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Sections */}
        <div className="space-y-10">
          {sections.map((s) => (
            <section key={s.id} id={s.id} className="scroll-mt-20">
              <h2 className="text-lg font-semibold text-[#0A0A0A] mb-3">{s.title}</h2>
              <div className="text-[#3F3F46] leading-relaxed text-sm">{s.content}</div>
            </section>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-[#E4E4E7] flex flex-wrap gap-4 text-sm text-[#71717A]">
          <Link href="/impressum" className="hover:text-[#16A34A] transition-colors">
            Impressum
          </Link>
          <Link href="/agb" className="hover:text-[#16A34A] transition-colors">
            AGB
          </Link>
          <Link href="/" className="hover:text-[#16A34A] transition-colors">
            Zur Startseite
          </Link>
        </div>
      </div>
    </main>
  )
}
