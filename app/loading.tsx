// ─────────────────────────────────────────────────────────────────
// app/loading.tsx
//
// Globale Loading-Seite (Next.js Streaming Suspense Fallback).
// Dark-Theme: bg-[#0A0A0A] mit SportRise-Logo und Fortschrittsbalken.
// ─────────────────────────────────────────────────────────────────

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center gap-8">
      {/* ── SportRise-Logo SVG ──────────────────────────────────── */}
      {/*  Stilisiertes "SR"-Monogramm mit Pulse-Animation           */}
      <div
        className="flex items-center gap-3"
        style={{ animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}
      >
        {/* Icon: Abstrakter Sport-Bogen */}
        <svg
          width="44"
          height="44"
          viewBox="0 0 44 44"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          {/* Äußerer Ring */}
          <circle cx="22" cy="22" r="20" stroke="#16A34A" strokeWidth="2.5" />
          {/* Dynamischer Aufwärtspfeil / Blitz-Form */}
          <path
            d="M25 10L16 23H22L19 34L28 21H22L25 10Z"
            fill="#16A34A"
            strokeLinejoin="round"
          />
        </svg>

        {/* Wortmarke */}
        <div>
          <span className="text-white font-black text-2xl tracking-tight leading-none">
            Sport
          </span>
          <span
            className="font-black text-2xl tracking-tight leading-none"
            style={{ color: '#16A34A' }}
          >
            Rise
          </span>
        </div>
      </div>

      {/* ── Fortschrittsbalken ──────────────────────────────────── */}
      <div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full animate-load-progress"
          style={{
            background: 'linear-gradient(to right, #16A34A, #4ADE80)',
          }}
        />
      </div>
    </div>
  )
}
