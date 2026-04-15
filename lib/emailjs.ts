// ─────────────────────────────────────────────────────────────────
// emailjs.ts – Admin-Benachrichtigungen via @emailjs/nodejs SDK
//
// Schickt E-Mails an den Admin bei neuen Verein- und Turnier-
// Einreichungen. Verwendet EmailJS als Relay ohne eigenen E-Mail-Server.
//
// Konfiguration via Umgebungsvariablen (ohne NEXT_PUBLIC_ Praefix,
// da diese nur server-seitig verwendet werden):
//   EMAILJS_SERVICE_ID
//   EMAILJS_TEMPLATE_VEREIN
//   EMAILJS_TEMPLATE_TURNIER
//   EMAILJS_PUBLIC_KEY
//   EMAILJS_PRIVATE_KEY
//   ADMIN_EMAIL
// ─────────────────────────────────────────────────────────────────

import { init, send } from '@emailjs/nodejs'

// ── Interfaces ───────────────────────────────────────────────────

export interface VereinEinreichungData {
  vereinName: string
  vereinStadt: string
  vereinSport: string
  einreicherName: string
  einreicherEmail: string
  confirm_link: string
  reject_link: string
}

export interface TurnierEinreichungData {
  turnierName: string
  turnierStadt: string
  turnierSport: string
  turnierDatum: string
  einreicherName: string
  einreicherEmail: string
  confirm_link: string
  reject_link: string
}

// ── Internal: Ensure EmailJS is initialized ──────────────────────

let initialized = false

function ensureInit(): void {
  if (initialized) return
  const publicKey = process.env.EMAILJS_PUBLIC_KEY
  const privateKey = process.env.EMAILJS_PRIVATE_KEY
  if (!publicKey) return
  init({ publicKey, privateKey: privateKey || undefined })
  initialized = true
}

// ── Public: Verein-Einreichung an Admin ──────────────────────────

export async function sendVereinEinreichung(
  data: VereinEinreichungData,
): Promise<void> {
  const serviceId = process.env.EMAILJS_SERVICE_ID
  const templateId = process.env.EMAILJS_TEMPLATE_VEREIN
  const publicKey = process.env.EMAILJS_PUBLIC_KEY
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@sportrise.de'

  if (!serviceId || !templateId || !publicKey) {
    throw new Error(
      'EmailJS nicht konfiguriert. Pruefe EMAILJS_SERVICE_ID, ' +
        'EMAILJS_TEMPLATE_VEREIN und EMAILJS_PUBLIC_KEY in der .env.local.',
    )
  }

  ensureInit()

  await send(
    serviceId,
    templateId,
    {
      to_email: adminEmail,
      verein_name: data.vereinName,
      verein_stadt: data.vereinStadt,
      verein_sport: data.vereinSport,
      einreicher_name: data.einreicherName,
      einreicher_email: data.einreicherEmail,
      confirm_link: data.confirm_link,
      reject_link: data.reject_link,
    },
    { publicKey },
  )
}

// ── Public: Turnier-Einreichung an Admin ──────────────────────────

export async function sendTurnierEinreichung(
  data: TurnierEinreichungData,
): Promise<void> {
  const serviceId = process.env.EMAILJS_SERVICE_ID
  const templateId = process.env.EMAILJS_TEMPLATE_TURNIER
  const publicKey = process.env.EMAILJS_PUBLIC_KEY
  const adminEmail = process.env.ADMIN_EMAIL ?? 'admin@sportrise.de'

  if (!serviceId || !templateId || !publicKey) {
    throw new Error(
      'EmailJS nicht konfiguriert. Pruefe EMAILJS_SERVICE_ID, ' +
        'EMAILJS_TEMPLATE_TURNIER und EMAILJS_PUBLIC_KEY in der .env.local.',
    )
  }

  ensureInit()

  await send(
    serviceId,
    templateId,
    {
      to_email: adminEmail,
      turnier_name: data.turnierName,
      turnier_stadt: data.turnierStadt,
      turnier_sport: data.turnierSport,
      turnier_datum: data.turnierDatum,
      einreicher_name: data.einreicherName,
      einreicher_email: data.einreicherEmail,
      confirm_link: data.confirm_link,
      reject_link: data.reject_link,
    },
    { publicKey },
  )
}