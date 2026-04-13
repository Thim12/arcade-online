import type { Metadata } from 'next'
import Link from 'next/link'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Impressum',
  description: 'Impressum von SportRise — Pflichtangaben gemäß § 5 TMG.',
}

export default function ImpressumPage(): React.JSX.Element {
  return (
    <main className="min-h-screen bg-[#FAFAFA] py-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-[#0A0A0A] rounded-xl flex items-center justify-center flex-shrink-0">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#0A0A0A]">Impressum</h1>
        </div>
        <p className="text-[#71717A] mb-10 ml-[52px]">
          Pflichtangaben gemäß § 5 TMG und § 55 RStV
        </p>

        <div className="space-y-10">
          {/* Angaben gem. § 5 TMG */}
          <section>
            <h2 className="text-lg font-semibold text-[#0A0A0A] mb-3">
              Angaben gemäß § 5 TMG
            </h2>
            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 text-sm text-[#3F3F46] leading-relaxed space-y-1">
              <p className="font-semibold text-[#0A0A0A]">SportRise</p>
              <p>Tim Lohr</p>
              <p>Musterstraße 1</p>
              <p>60311 Frankfurt am Main</p>
              <p>Deutschland</p>
            </div>
          </section>

          {/* Kontakt */}
          <section>
            <h2 className="text-lg font-semibold text-[#0A0A0A] mb-3">Kontakt</h2>
            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 text-sm text-[#3F3F46] leading-relaxed space-y-1">
              <p>
                <span className="text-[#71717A]">E-Mail:</span>{' '}
                <a
                  href="mailto:kontakt@sportrise.de"
                  className="text-[#16A34A] underline underline-offset-2"
                >
                  kontakt@sportrise.de
                </a>
              </p>
              <p>
                <span className="text-[#71717A]">Website:</span>{' '}
                <span>sportrise.de</span>
              </p>
            </div>
          </section>

          {/* Verantwortlich f. Inhalt */}
          <section>
            <h2 className="text-lg font-semibold text-[#0A0A0A] mb-3">
              Verantwortlich für den Inhalt gemäß § 55 Abs. 2 RStV
            </h2>
            <div className="bg-white border border-[#E4E4E7] rounded-2xl p-6 text-sm text-[#3F3F46] leading-relaxed space-y-1">
              <p className="font-semibold text-[#0A0A0A]">Tim Lohr</p>
              <p>Musterstraße 1</p>
              <p>60311 Frankfurt am Main</p>
            </div>
          </section>

          {/* Haftungsausschluss */}
          <section>
            <h2 className="text-lg font-semibold text-[#0A0A0A] mb-3">
              Haftungsausschluss
            </h2>
            <div className="text-sm text-[#3F3F46] leading-relaxed space-y-4">
              <div>
                <h3 className="font-medium text-[#0A0A0A] mb-1">Haftung für Inhalte</h3>
                <p>
                  Als Diensteanbieter sind wir gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen
                  Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8–10 TMG sind wir
                  als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte
                  fremde Informationen zu überwachen oder nach Umständen zu forschen, die auf eine
                  rechtswidrige Tätigkeit hinweisen.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[#0A0A0A] mb-1">Haftung für Links</h3>
                <p>
                  Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir
                  keinen Einfluss haben. Für die Inhalte der verlinkten Seiten ist stets der
                  jeweilige Anbieter oder Betreiber der Seiten verantwortlich. Die verlinkten
                  Seiten wurden zum Zeitpunkt der Verlinkung auf mögliche Rechtsverstöße überprüft.
                  Rechtswidrige Inhalte waren zum Zeitpunkt der Verlinkung nicht erkennbar.
                </p>
              </div>
              <div>
                <h3 className="font-medium text-[#0A0A0A] mb-1">Urheberrecht</h3>
                <p>
                  Die durch die Seitenbetreiber erstellten Inhalte und Werke auf diesen Seiten
                  unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung,
                  Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechtes
                  bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
                </p>
              </div>
            </div>
          </section>

          {/* Streitschlichtung */}
          <section>
            <h2 className="text-lg font-semibold text-[#0A0A0A] mb-3">
              Online-Streitbeilegung (OS)
            </h2>
            <p className="text-sm text-[#3F3F46] leading-relaxed">
              Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS)
              bereit. Die Plattform ist unter{' '}
              <span className="text-[#71717A]">ec.europa.eu/consumers/odr</span> erreichbar. Wir
              sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor
              einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </section>
        </div>

        {/* Footer links */}
        <div className="mt-16 pt-8 border-t border-[#E4E4E7] flex flex-wrap gap-4 text-sm text-[#71717A]">
          <Link href="/datenschutz" className="hover:text-[#16A34A] transition-colors">
            Datenschutzerklärung
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
