import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import SessionProvider from '@/components/providers/SessionProvider'
import { XpAnimationProvider } from '@/components/providers/XpAnimationProvider'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'SportRise — Kostenloser Sport für alle',
    template: '%s | SportRise',
  },
  description:
    'SportRise ist die kostenlose, werbefreie Sportplattform für Jugendliche und Amateursportler in Deutschland. KI-Trainingsplan, Vereinssuche, Turniere und Community – alles an einem Ort.',
  keywords: [
    'Sport',
    'Training',
    'Fußball',
    'Tennis',
    'Basketball',
    'Verein',
    'Turnier',
    'Hessen',
    'Deutschland',
    'kostenlos',
    'KI-Trainingsplan',
  ],
  authors: [{ name: 'SportRise Team' }],
  creator: 'SportRise',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'de_DE',
    siteName: 'SportRise',
    title: 'SportRise — Kostenloser Sport für alle',
    description:
      'Kostenlose, werbefreie Sportplattform für Jugendliche und Amateursportler in Deutschland.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SportRise — Kostenloser Sport für alle',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}): React.JSX.Element {
  return (
    <html lang="de" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <SessionProvider>
          <XpAnimationProvider>
            {children}
          </XpAnimationProvider>
        </SessionProvider>
        <Toaster
          richColors
          position="bottom-right"
          duration={4000}
        />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
