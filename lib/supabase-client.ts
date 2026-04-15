// ─────────────────────────────────────────────────────────────────
// lib/supabase-client.ts – Supabase Browser-Client
//
// Für Client Components ('use client').
// Nutzt KEINE next/headers – sicher für Browser-Imports.
// ─────────────────────────────────────────────────────────────────

import { createBrowserClient as createSSRBrowser } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── Browser-Client ───────────────────────────────────────────────
// Für Client Components ('use client').
// Nutzt localStorage/Cookie-basierte Session ohne next/headers.
export function createBrowserClient() {
  return createSSRBrowser(SUPABASE_URL, SUPABASE_ANON_KEY)
}
