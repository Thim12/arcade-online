// ─────────────────────────────────────────────────────────────────
// TickerSection – Horizontaler Live-Aktivitäts-Ticker
//
// Server Component – reine CSS-Animation (keine Client-Direktive nötig).
//
// Aufbau:
//   • Dunkle Trennleiste zwischen Hero und Features
//   • Endlos-Ticker mit Echtzeit-Aktivitäten aus der DB (oder Fallback)
//   • Inhalt wird dupliziert → nahtloser Loop (CSS translateX(-50%))
//   • AnimationDuration via inline style: 48 s (überschreibt globals.css 30 s)
//   • Pause beim Hover (über .ticker-container:hover in globals.css)
// ─────────────────────────────────────────────────────────────────

// ── Typen ─────────────────────────────────────────────────────────

interface TickerItem {
  id: string
  text: string
}

interface TickerSectionProps {
  items: TickerItem[]
}

// ── Fallback-Items (wenn DB leer) ─────────────────────────────────

const FALLBACK_ITEMS: TickerItem[] = [
  { id: 'f01', text: 'Lukas aus Frankfurt — 45 Min. Fußball-Training absolviert' },
  { id: 'f02', text: 'Anna aus Wiesbaden folgt jetzt dem TSV Einheit Frankfurt' },
  { id: 'f03', text: 'Max hat das Abzeichen "Erster Schritt" erhalten' },
  { id: 'f04', text: 'Jonas aus Kassel — 60 Min. Basketball-Training absolviert' },
  { id: 'f05', text: 'Sarah folgt jetzt dem TC Rot-Weiß Kassel' },
  { id: 'f06', text: 'Tim hat das Abzeichen "7 Tage am Stück" erhalten' },
  { id: 'f07', text: 'Felix aus Darmstadt — 30 Min. Tennis-Training absolviert' },
  { id: 'f08', text: 'Laura aus Fulda folgt jetzt dem VfB 1900 Gießen' },
  { id: 'f09', text: 'Marco aus Gießen — 50 Min. Fußball-Training absolviert' },
  { id: 'f10', text: 'Nina hat das Abzeichen "Durchstarter" erhalten' },
  { id: 'f11', text: 'Kevin aus Offenbach — 40 Min. Basketball-Training absolviert' },
  { id: 'f12', text: 'Lena folgt jetzt dem TSG Marburg Tennis' },
]

// ── Komponente ────────────────────────────────────────────────────

export default function TickerSection({ items }: TickerSectionProps) {
  const display = items.length > 0 ? items : FALLBACK_ITEMS

  return (
    <div
      className="relative overflow-hidden bg-gray-950 border-y border-white/[0.06] py-3.5"
      aria-label="Aktuelle Aktivitäten auf SportRise"
    >
      {/* Seitliche Fade-Masken */}
      <div
        className="absolute inset-y-0 left-0 w-16 z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(to right, rgb(3 7 18), transparent)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-y-0 right-0 w-16 z-10 pointer-events-none"
        style={{
          background:
            'linear-gradient(to left, rgb(3 7 18), transparent)',
        }}
        aria-hidden="true"
      />

      {/* Ticker */}
      <div className="ticker-container">
        <div
          className="ticker-content"
          style={{ animationDuration: '48s' }}
        >
          {/* Erste Kopie */}
          {display.map((item) => (
            <span
              key={item.id}
              className="inline-flex items-center gap-3 mx-8"
            >
              <span
                className="w-1.5 h-1.5 rounded-full bg-green-400/70 shrink-0"
                aria-hidden="true"
              />
              <span className="text-sm text-white/45 font-mono whitespace-nowrap">
                {item.text}
              </span>
            </span>
          ))}

          {/* Zweite Kopie für nahtlosen Loop */}
          {display.map((item) => (
            <span
              key={`${item.id}-dup`}
              aria-hidden="true"
              className="inline-flex items-center gap-3 mx-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400/70 shrink-0" />
              <span className="text-sm text-white/45 font-mono whitespace-nowrap">
                {item.text}
              </span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
