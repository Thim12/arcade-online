// ─────────────────────────────────────────────────────────────────
// emailjs.ts – Admin-Benachrichtigungen via EmailJS REST API
//
// Schickt E-Mails an den Admin bei neuen Verein- und Turnier-
// Einreichungen. Verwendet EmailJS als Relay ohne eigenen E-Mail-Server.
//
// Konfiguration via .env.local:
//   NEXT_PUBLIC_EMAILJS_SERVICE_ID
//   NEXT_PUBLIC_EMAILJS_TEMPLATE_VEREIN
//   NEXT_PUBLIC_EMAILJS_TEMPLATE_TURNIER
//   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
// ─────────────────────────────────────────────────────────────────

const EMAILJS_API = 'https://api.emailjs.com/api/v1.0/email/send'

// ── Interfaces ───────────────────────────────────────────────────

export interface VereinEinreichungData {
  vereinName: string
  vereinStadt: string
  vereinSport: string
  einreicherName: string
  einreicherEmail: string
  confirm_link: string    // Admin-Link: Verein bestätigen
  reject_link: string     // Admin-Link: Verein ablehnen
}

export interface TurnierEinreichungData {
  turnierName: string
  turnierStadt: string
  turnierSport: string
  turnierDatum: string    // Formatiert: "15. März 2025"
  einreicherName: string
  einreicherEmail: string
  confirm_link: string    // Admin-Link: Turnier bestätigen
  reject_link: string     // Admin-Link: Turnier ablehnen
}

// ── Interner Helper ──────────────────────────────────────────────

async function sendEmail(
  templateId: string,
  templateParams: Record<string, string>,
): Promise<void> {
  const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
  const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY

  if (!serviceId || !publicKey || !templateId) {
    throw new Error(
      'EmailJS nicht konfiguriert. Prüfe NEXT_PUBLIC_EMAILJS_SERVICE_ID, ' +
        'NEXT_PUBLIC_EMAILJS_PUBLIC_KEY und das Template-ID.',
    )
  }

  const body = JSON.stringify({
    service_id: serviceId,
    template_id: templateId,
    user_id: publicKey,
    template_params: {
      ...templateParams,
      admin_email: process.env.ADMIN_EMAIL ?? 'admin@sportrise.de',
    },
  })

  const response = await fetch(EMAILJS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Origin: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000',
    },
    body,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unbekannter Fehler')
    throw new Error(
      `EmailJS-Anfrage fehlgeschlagen (${response.status}): ${errorText}`,
    )
  }
}

// ── Öffentliche Funktionen ───────────────────────────────────────

/**
 * Benachrichtigt den Admin über eine neue Vereins-Einreichung.
 * Enthält Links zum direkten Bestätigen oder Ablehnen.
 */
export async function sendVereinEinreichung(
  data: VereinEinreichungData,
): Promise<void> {
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_VEREIN

  if (!templateId) {
    throw new Error(
      'NEXT_PUBLIC_EMAILJS_TEMPLATE_VEREIN ist nicht konfiguriert.',
    )
  }

  await sendEmail(templateId, {
    verein_name: data.vereinName,
    verein_stadt: data.vereinStadt,
    verein_sport: data.vereinSport,
    einreicher_name: data.einreicherName,
    einreicher_email: data.einreicherEmail,
    confirm_link: data.confirm_link,
    reject_link: data.reject_link,
  })
}

/**
 * Benachrichtigt den Admin über eine neue Turnier-Einreichung.
 * Enthält Links zum direkten Bestätigen oder Ablehnen.
 */
export async function sendTurnierEinreichung(
  data: TurnierEinreichungData,
): Promise<void> {
  const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_TURNIER

  if (!templateId) {
    throw new Error(
      'NEXT_PUBLIC_EMAILJS_TEMPLATE_TURNIER ist nicht konfiguriert.',
    )
  }

  await sendEmail(templateId, {
    turnier_name: data.turnierName,
    turnier_stadt: data.turnierStadt,
    turnier_sport: data.turnierSport,
    turnier_datum: data.turnierDatum,
    einreicher_name: data.einreicherName,
    einreicher_email: data.einreicherEmail,
    confirm_link: data.confirm_link,
    reject_link: data.reject_link,
  })
}
