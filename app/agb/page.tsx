import type { Metadata } from 'next'
import Link from 'next/link'
import { ScrollText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Allgemeine Geschäftsbedingungen',
  description: 'Nutzungsbedingungen von SportRise.',
}

interface Section {
  id: string
  title: string
  content: React.ReactNode
}

const sections: Section[] = [
  {
    id: 'geltungsbereich',
    title: '§ 1 Geltungsbereich',
    content: (
      <p>
        Diese Allgemeinen Geschäftsbedingungen (AGB) gelten für die Nutzung der Plattform SportRise
        (sportrise.de), betrieben vom SportRise-Team (Näheres im{' '}
        <Link href="/impressum" className="text-[#16A34A] underline underline-offset-2">
          Impressum
        </Link>
        ). Mit der Registrierung akzeptierst du diese AGB vollumfänglich.
      </p>
    ),
  },
  {
    id: 'leistung',
    title: '§ 2 Beschreibung der Leistung',
    content: (
      <>
        <p className="mb-2">
          SportRise ist eine <strong>kostenlose, werbefreie</strong> Sportplattform für Jugendliche
          und Amateursportler in Deutschland. Die Plattform bietet:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>KI-gestützte Trainingspläne (eigene KI-Engine, kein externer Bot)</li>
          <li>Vereins- und Sportplatzsuchdienst</li>
          <li>Turnierverwaltung und -teilnahme</li>
          <li>Community-Funktionen (Beiträge, Kommentare, Direktnachrichten)</li>
          <li>Gamification (XP-System, Abzeichen, Ranglisten)</li>
        </ul>
        <p className="mt-2">
          SportRise behält sich vor, den Funktionsumfang jederzeit zu erweitern, einzuschränken
          oder einzustellen, insbesondere bei technischen Gründen oder mangelnder Nachfrage.
        </p>
      </>
    ),
  },
  {
    id: 'mindestalter',
    title: '§ 3 Mindestalter & Jugendschutz',
    content: (
      <>
        <div className="bg-[#FFF7ED] border border-[#FED7AA] rounded-xl p-4 mb-3">
          <p className="text-sm font-medium text-[#92400E]">
            Mindestalter: 6 Jahre. Nutzer unter 13 Jahren benötigen die ausdrückliche Einwilligung
            eines Erziehungsberechtigten.
          </p>
        </div>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>
            Nutzer zwischen 6 und 12 Jahren dürfen die Plattform nur unter Aufsicht oder mit
            Einwilligung der Erziehungsberechtigten nutzen.
          </li>
          <li>
            Inhalte, die für Kinder ungeeignet sind (Gewalt, Diskriminierung, sexuelle Inhalte),
            sind verboten und werden unverzüglich gelöscht.
          </li>
          <li>
            SportRise kooperiert mit den Regelungen des JuSchG (Jugendschutzgesetz) und des JMStV
            (Jugendmedienschutz-Staatsvertrag).
          </li>
          <li>
            Eltern und Erziehungsberechtigte können jederzeit die Löschung eines minderjährigen
            Kontos beantragen unter: kontakt@sportrise.de
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'registrierung',
    title: '§ 4 Registrierung & Konto',
    content: (
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>
          Für die Nutzung der meisten Funktionen ist eine kostenlose Registrierung erforderlich.
        </li>
        <li>
          Jede Person darf nur ein Konto anlegen. Mehrfachkonten sind untersagt und führen zur
          Sperrung aller betroffenen Konten.
        </li>
        <li>
          Du bist für die Sicherheit deines Kontos und die unter deinem Konto getätigten
          Aktivitäten verantwortlich.
        </li>
        <li>
          Falsche Angaben bei der Registrierung (insbesondere zum Alter) berechtigen SportRise zur
          sofortigen Kontolöschung.
        </li>
        <li>
          SportRise behält sich vor, Konten ohne Angabe von Gründen zu sperren, insbesondere bei
          Verstößen gegen diese AGB.
        </li>
      </ul>
    ),
  },
  {
    id: 'community',
    title: '§ 5 Community-Regeln',
    content: (
      <>
        <p className="mb-2 text-sm">Folgende Inhalte sind auf SportRise ausdrücklich verboten:</p>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Beleidigungen, Hassrede, Diskriminierung jeglicher Art</li>
          <li>Mobbing, Stalking oder Bedrohungen</li>
          <li>Sexuelle oder gewaltverherrlichende Inhalte</li>
          <li>Spam, Werbung und kommerzielle Inhalte ohne Erlaubnis</li>
          <li>Verbreitung von Fehlinformationen über Sportvereine oder -veranstaltungen</li>
          <li>Manipulation von Ranglisten oder XP-System (Cheating)</li>
          <li>Nutzung von automatisierten Bots oder Skripten</li>
          <li>Veröffentlichung personenbezogener Daten Dritter ohne deren Einwilligung</li>
        </ul>
        <p className="mt-3 text-sm">
          SportRise behält sich vor, regelwidrige Inhalte ohne Vorankündigung zu entfernen und
          entsprechende Konten zu sperren. Bei schwerwiegenden Verstößen erfolgt eine Meldung an
          die zuständigen Behörden.
        </p>
      </>
    ),
  },
  {
    id: 'nutzungsrechte',
    title: '§ 6 Nutzungsrechte & Inhalte',
    content: (
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>
          Du behältst das Urheberrecht an allen Inhalten, die du auf SportRise veröffentlichst
          (Texte, Fotos, Videos).
        </li>
        <li>
          Durch das Veröffentlichen räumst du SportRise ein einfaches, weltweites, unentgeltliches
          Nutzungsrecht ein, um die Inhalte auf der Plattform darzustellen und technisch zu
          verarbeiten.
        </li>
        <li>
          Dieses Nutzungsrecht erlischt bei Löschung der Inhalte oder des Kontos, soweit keine
          gesetzlichen Aufbewahrungspflichten entgegenstehen.
        </li>
        <li>
          Du versicherst, dass die von dir eingestellten Inhalte frei von Rechten Dritter sind oder
          du die erforderlichen Nutzungsrechte besitzt.
        </li>
      </ul>
    ),
  },
  {
    id: 'ki',
    title: '§ 7 KI-Trainingspläne',
    content: (
      <>
        <p className="mb-2 text-sm">
          Die von SportRise generierten Trainingspläne werden von einer{' '}
          <strong>eigens entwickelten KI-Engine</strong> erstellt und dienen ausschließlich als
          unverbindliche Empfehlungen.
        </p>
        <p className="text-sm">
          SportRise übernimmt keine Haftung für gesundheitliche Schäden, die aus der Befolgung
          von KI-generierten Trainingsplänen entstehen. Bei gesundheitlichen Einschränkungen
          oder Vorerkrankungen ist vor Beginn eines Trainingsprogramms eine medizinische
          Beratung erforderlich.
        </p>
      </>
    ),
  },
  {
    id: 'haftung',
    title: '§ 8 Haftungsbeschränkung',
    content: (
      <ul className="list-disc pl-5 space-y-1 text-sm">
        <li>
          SportRise haftet nicht für Schäden, die durch vorübergehende Nichtverfügbarkeit der
          Plattform entstehen.
        </li>
        <li>
          SportRise haftet nicht für Inhalte, die von Nutzern eingestellt wurden.
        </li>
        <li>
          SportRise haftet nicht für Schäden, die durch die Nutzung verlinkter externer Seiten
          entstehen.
        </li>
        <li>
          Die vorstehenden Haftungsausschlüsse gelten nicht für Schäden aus der Verletzung von
          Leben, Körper und Gesundheit sowie für vorsätzlich oder grob fahrlässig verursachte
          Schäden.
        </li>
      </ul>
    ),
  },
  {
    id: 'kuendigung',
    title: '§ 9 Kündigung & Kontolöschung',
    content: (
      <>
        <p className="mb-2 text-sm">
          Du kannst dein Konto jederzeit und ohne Angabe von Gründen in den Profileinstellungen
          oder per E-Mail an kontakt@sportrise.de löschen lassen.
        </p>
        <p className="text-sm">
          SportRise kann Konten bei schwerwiegenden oder wiederholten Verstößen gegen diese AGB
          fristlos sperren oder löschen. In diesem Fall hast du keinen Anspruch auf Wiederherstellung
          des Kontos oder der darin enthaltenen Daten.
        </p>
      </>
    ),
  },
  {
    id: 'aenderungen',
    title: '§ 10 Änderungen der AGB',
    content: (
      <p className="text-sm">
        SportRise behält sich vor, diese AGB jederzeit zu ändern. Registrierte Nutzer werden bei
        wesentlichen Änderungen per E-Mail informiert. Die Weiternutzung der Plattform nach
        Inkrafttreten der geänderten AGB gilt als Zustimmung. Stand: April 2026.
      </p>
    ),
  },
  {
    id: 'recht',
    title: '§ 11 Anwendbares Recht & Gerichtsstand',
    content: (
      <p className="text-sm">
        Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
        Gerichtsstand für alle Streitigkeiten aus oder im Zusammenhang mit diesen AGB ist
        Frankfurt am Main, sofern der Nutzer Kaufmann, juristische Person des öffentlichen Rechts
        oder ein öffentlich-rechtliches Sondervermögen ist oder keinen allgemeinen Gerichtsstand
        in Deutschland hat.
      </p>
    ),
  },
]

export default function AgbPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-[#FAFAFA] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#52525B] rounded-xl flex items-center justify-center flex-shrink-0">
            <ScrollText className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#0A0A0A]">
            Allgemeine Geschäftsbedingungen
          </h1>
        </div>
        <p className="text-[#71717A] mb-10 ml-[52px]">Gültig ab April 2026 · SportRise</p>

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
              <div className="text-[#3F3F46] leading-relaxed">{s.content}</div>
            </section>
          ))}
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-[#E4E4E7] flex flex-wrap gap-4 text-sm text-[#71717A]">
          <Link href="/datenschutz" className="hover:text-[#16A34A] transition-colors">
            Datenschutzerklärung
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
