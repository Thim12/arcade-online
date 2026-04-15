// ─────────────────────────────────────────────────────────────────
// lib/supabase-server.ts – Supabase Server-seitige Clients
//
// Nur für Server Components und Route Handlers.
// Importiert next/headers – darf NIEMALS von Client-Komponenten
// importiert werden.
//
// Varianten:
//   1. createServerClient()  → Server Components / Route Handlers
//   2. getSupabaseAdmin()    → Admin-Operationen (umgeht RLS)
// ─────────────────────────────────────────────────────────────────

import {
  createServerClient as createSSRServer,
  type CookieOptions,
} from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── Server-Client ────────────────────────────────────────────────
// Für Server Components und Route Handlers.
// Liest/schreibt Cookies über next/headers – niemals im Edge verwenden.
export function createServerClient() {
  const cookieStore = cookies()

  return createSSRServer(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // In Server Components sind Set-Operationen nicht erlaubt –
          // wird ignoriert, da der Auth-Flow das Cookie über Middleware setzt.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // Gleicher Grund wie bei set()
        }
      },
    },
  })
}

// ── Admin-Client ─────────────────────────────────────────────────
// ACHTUNG: Umgeht Row Level Security vollständig!
// Nur für serverseitige Admin-Operationen verwenden.
// NIEMALS in NEXT_PUBLIC_* oder Client-Code einsetzen.
//
// Lazy-Init: Client wird erst beim ersten Aufruf erstellt, damit ein
// fehlender SUPABASE_SERVICE_ROLE_KEY beim Modulstart keinen Fehler wirft.
let _supabaseAdmin: ReturnType<typeof createClient> | null = null

export function getSupabaseAdmin(): ReturnType<typeof createClient> {
  if (_supabaseAdmin !== null) return _supabaseAdmin

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY ist nicht konfiguriert. ' +
        'Bitte in der .env-Datei setzen.',
    )
  }

  _supabaseAdmin = createClient(SUPABASE_URL, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return _supabaseAdmin
}
