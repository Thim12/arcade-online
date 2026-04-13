// ─────────────────────────────────────────────────────────────────
// PageLayout – Standard-Seitenlayout mit Navbar + Footer
//
// Verwendung: Alle Seiten außer der Homepage (die ihren eigenen
// Hero-Bereich hat) können dieses Layout verwenden.
//
// Beispiel:
//   export default function MeinePage() {
//     return (
//       <PageLayout>
//         <section>...</section>
//       </PageLayout>
//     )
//   }
// ─────────────────────────────────────────────────────────────────

import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

interface PageLayoutProps {
  children: React.ReactNode
}

export default function PageLayout({ children }: PageLayoutProps): React.JSX.Element {
  return (
    <>
      <Navbar />
      {/* pt-16: Ausgleich für die fixed Navbar (h-16) */}
      <main className="pt-16 min-h-screen">{children}</main>
      <Footer />
    </>
  )
}
