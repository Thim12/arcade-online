import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'

interface PageLayoutProps {
  children: React.ReactNode
}

export default function PageLayout({ children }: PageLayoutProps): React.JSX.Element {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-screen bg-[#FAFAFA]">{children}</main>
      <Footer />
    </>
  )
}