// ─────────────────────────────────────────────────────────────────
// resend.ts – Transaktionale E-Mails via Resend
//
// Alle User-seitigen E-Mails (Willkommen, Bestätigung, Ablehnung).
// Kein Emoji in E-Mails. SportRise-Grün (#16a34a) als Akzentfarbe.
//
// Konfiguration via .env.local:
//   RESEND_API_KEY
//   RESEND_FROM_EMAIL   (Standard: noreply@sportrise.de)
//   NEXT_PUBLIC_APP_URL (für Links in E-Mails)
// ─────────────────────────────────────────────────────────────────

import { Resend } from 'resend'

// Lazy initialization: prevent module-level throw when RESEND_API_KEY is not set.
// The constructor throws on empty string; each send function's try/catch handles it.
let _resend: Resend | null = null

function getResend(): Resend {
  if (_resend === null) {
    const key = process.env.RESEND_API_KEY
    if (!key) throw new Error('RESEND_API_KEY ist nicht konfiguriert.')
    _resend = new Resend(key)
  }
  return _resend
}

const FROM = process.env.RESEND_FROM_EMAIL ?? 'noreply@sportrise.de'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://sportrise.de'

export interface EmailResult {
  success: boolean
  error?: string
}

// ── HTML Template-Helfer ─────────────────────────────────────────

function emailWrapper(content: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SportRise</title>
</head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  ${preheader ? `<span style="display:none;max-height:0;overflow:hidden;">${preheader}</span>` : ''}
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:#1e293b;border-radius:12px;overflow:hidden;border:1px solid rgba(255,255,255,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#16a34a,#15803d);padding:32px 40px;text-align:center;">
              <p style="margin:0;font-size:24px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">SportRise</p>
              <p style="margin:6px 0 0;font-size:13px;color:rgba(255,255,255,0.75);">Deine Sportplattform in Deutschland</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:40px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
              <p style="margin:0;font-size:12px;color:#64748b;">SportRise.de &mdash; Kostenlos. Werbefrei. Fur dich.</p>
              <p style="margin:6px 0 0;font-size:12px;color:#475569;">
                <a href="${APP_URL}/datenschutz" style="color:#16a34a;text-decoration:none;">Datenschutz</a>
                &nbsp;&middot;&nbsp;
                <a href="${APP_URL}/impressum" style="color:#16a34a;text-decoration:none;">Impressum</a>
                &nbsp;&middot;&nbsp;
                <a href="${APP_URL}/agb" style="color:#16a34a;text-decoration:none;">AGB</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background-color:#16a34a;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:14px 28px;border-radius:8px;margin-top:24px;">${label}</a>`
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f1f5f9;letter-spacing:-0.3px;">${text}</h1>`
}

function paragraph(text: string): string {
  return `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#94a3b8;">${text}</p>`
}

function highlight(text: string): string {
  return `<strong style="color:#16a34a;">${text}</strong>`
}

// ── Eltern-Verifizierung (Jugendschutz unter 14) ─────────────────

export async function sendElternVerificationEmail(params: {
  elternEmail: string
  kindName: string
  verificationLink: string
  denyLink: string
}): Promise<EmailResult> {
  const { elternEmail, kindName, verificationLink, denyLink } = params

  try {
    await getResend().emails.send({
      from: FROM,
      to: [elternEmail],
      subject: `${kindName} möchte SportRise nutzen — kurze Bestätigung nötig.`,
      html: emailWrapper(
        `
        ${heading(`${kindName} möchte SportRise beitreten`)}
        ${paragraph(`Ihr Kind <strong style="color:#f1f5f9;">${kindName}</strong> hat sich bei SportRise registriert. Da ${kindName} unter 14 Jahre alt ist, benötigen wir nach DSGVO Ihre Zustimmung als Erziehungsberechtigter/e.`)}
        <div style="margin:24px 0;padding:16px;background-color:#f0fdf4;border-left:3px solid #16a34a;border-radius:4px;">
          <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#15803d;text-transform:uppercase;letter-spacing:0.5px;">Was Sie wissen sollten</p>
          <ul style="margin:0;padding-left:18px;color:#166534;font-size:14px;line-height:2;">
            <li>SportRise ist kostenlos und enthält keine Werbung</li>
            <li>Es werden keine personenbezogenen Daten an Dritte weitergegeben</li>
            <li>Die Plattform richtet sich an Jugendliche und Amateursportler in Deutschland</li>
            <li>Sie können die Zustimmung jederzeit widerrufen</li>
          </ul>
        </div>
        ${paragraph('Bitte klicken Sie auf den Button unten, um die Teilnahme zu bestätigen. Der Link ist 48 Stunden gültig.')}
        <div style="text-align:center;">
          ${button(verificationLink, 'Teilnahme bestätigen')}
        </div>
        <div style="margin-top:24px;text-align:center;">
          <a href="${denyLink}" style="font-size:13px;color:#ef4444;text-decoration:underline;">Ablehnen</a>
        </div>
        ${paragraph('Falls Sie diese E-Mail nicht erwartet haben, können Sie sie ignorieren. Es werden keine Daten gespeichert.')}
        `,
        `${kindName} möchte SportRise nutzen — kurze Bestätigung nötig.`,
      ),
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

// ── Willkommens-E-Mail ───────────────────────────────────────────

export async function sendWelcomeEmail(params: {
  toEmail: string
  vorname: string
}): Promise<EmailResult> {
  const { toEmail, vorname } = params
  const dashboardLink = `${APP_URL}/dashboard`

  try {
    await getResend().emails.send({
      from: FROM,
      to: [toEmail],
      subject: `Willkommen bei SportRise, ${vorname}!`,
      html: emailWrapper(
        `
        ${heading(`Willkommen, ${vorname}!`)}
        ${paragraph('Dein Account ist aktiviert. SportRise ist deine kostenlose, werbefreie Sportplattform in Deutschland.')}
        <div style="margin:24px 0;padding:20px;background-color:rgba(22,163,74,0.1);border:1px solid rgba(22,163,74,0.25);border-radius:8px;">
          <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#16a34a;letter-spacing:0.5px;text-transform:uppercase;">Badge verdient</p>
          <p style="margin:0;font-size:20px;font-weight:700;color:#f1f5f9;">Erster Schritt</p>
          <p style="margin:4px 0 0;font-size:13px;color:#94a3b8;">+50 XP &mdash; Deine Reise beginnt.</p>
        </div>
        ${paragraph('Deine ersten drei Schritte:')}
        <ol style="margin:0 0 24px;padding-left:20px;color:#94a3b8;font-size:15px;line-height:2.2;">
          <li>Vervollständige dein Profil im Onboarding</li>
          <li>Starte deinen ersten KI-generierten Trainingsplan</li>
          <li>Entdecke Vereine und Turniere in deiner Region</li>
        </ol>
        <div style="text-align:center;">
          ${button(dashboardLink, 'SportRise öffnen')}
        </div>
        `,
        `Willkommen bei SportRise, ${vorname}! Dein kostenloses Sportprofil wartet.`,
      ),
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

// ── Verein Bestätigung ───────────────────────────────────────────

export async function sendVereinConfirmationEmail(params: {
  toEmail: string
  vereinName: string
  vereinSlug: string
}): Promise<EmailResult> {
  const { toEmail, vereinName, vereinSlug } = params
  const vereinLink = `${APP_URL}/vereine/${vereinSlug}`

  try {
    await getResend().emails.send({
      from: FROM,
      to: [toEmail],
      subject: `${vereinName} wurde verifiziert`,
      html: emailWrapper(
        `
        ${heading('Ihr Verein wurde verifiziert')}
        ${paragraph(`${highlight(vereinName)} ist jetzt auf SportRise gelistet und fur alle Sportler in Deutschland sichtbar.`)}
        ${paragraph('Ihr Verein erscheint jetzt in den Suchergebnissen und Vereinsempfehlungen unserer KI. Sportler konnen Ihrem Verein folgen und Kontakt aufnehmen.')}
        <div style="text-align:center;">
          ${button(vereinLink, 'Vereinsprofil ansehen')}
        </div>
        `,
        `${vereinName} wurde erfolgreich auf SportRise verifiziert.`,
      ),
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

// ── Verein Ablehnung ─────────────────────────────────────────────

export async function sendVereinRejectionEmail(params: {
  toEmail: string
  vereinName: string
  reason?: string
}): Promise<EmailResult> {
  const { toEmail, vereinName, reason } = params
  const supportLink = `${APP_URL}/kontakt`

  try {
    await getResend().emails.send({
      from: FROM,
      to: [toEmail],
      subject: `Einreichung fur ${vereinName} wurde abgelehnt`,
      html: emailWrapper(
        `
        ${heading('Einreichung konnte nicht bestatigt werden')}
        ${paragraph(`Die Einreichung von ${highlight(vereinName)} konnte leider nicht bestatigt werden.`)}
        ${reason ? `<div style="margin:0 0 16px;padding:16px;background-color:rgba(239,68,68,0.08);border-left:3px solid #ef4444;border-radius:4px;">${paragraph(`Grund: ${reason}`)}</div>` : ''}
        ${paragraph('Falls Sie Fragen haben oder die Einreichung korrigieren mochten, kontaktieren Sie uns bitte. Wir helfen Ihnen gerne weiter.')}
        <div style="text-align:center;">
          ${button(supportLink, 'Support kontaktieren')}
        </div>
        `,
        `Die Einreichung fur ${vereinName} wurde abgelehnt.`,
      ),
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

// ── Turnier Bestätigung ──────────────────────────────────────────

export async function sendTournamentConfirmationEmail(params: {
  toEmail: string
  userName: string
  turnierName: string
  turnierDatum: string
  turnierStadt: string
  turnierSlug: string
}): Promise<EmailResult> {
  const { toEmail, userName, turnierName, turnierDatum, turnierStadt, turnierSlug } = params
  const turnierLink = `${APP_URL}/turniere/${turnierSlug}`

  try {
    await getResend().emails.send({
      from: FROM,
      to: [toEmail],
      subject: `Anmeldung bestatigt: ${turnierName}`,
      html: emailWrapper(
        `
        ${heading('Deine Turnieranmeldung ist bestatigt')}
        ${paragraph(`Hallo ${userName}, du bist offiziell fur ${highlight(turnierName)} angemeldet.`)}
        <div style="margin:0 0 24px;padding:20px;background-color:rgba(22,163,74,0.08);border-radius:8px;border:1px solid rgba(22,163,74,0.2);">
          <table cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td style="padding:4px 0;font-size:14px;color:#64748b;width:100px;">Turnier</td>
              <td style="padding:4px 0;font-size:14px;color:#f1f5f9;font-weight:600;">${turnierName}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:14px;color:#64748b;">Datum</td>
              <td style="padding:4px 0;font-size:14px;color:#f1f5f9;">${turnierDatum}</td>
            </tr>
            <tr>
              <td style="padding:4px 0;font-size:14px;color:#64748b;">Ort</td>
              <td style="padding:4px 0;font-size:14px;color:#f1f5f9;">${turnierStadt}</td>
            </tr>
          </table>
        </div>
        ${paragraph('Halte Ausschau nach weiteren Informationen vom Veranstalter. Details und Austausch findest du auf der Turnier-Seite.')}
        <div style="text-align:center;">
          ${button(turnierLink, 'Zum Turnier')}
        </div>
        `,
        `Deine Anmeldung fur ${turnierName} am ${turnierDatum} in ${turnierStadt} ist bestatigt.`,
      ),
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

// ── Verein Einreichung Bestätigung (an Einreicher) ───────────────

export async function sendVereinEinreichungBestaetigung(params: {
  toEmail: string
  einreicherVorname: string
  vereinName: string
}): Promise<EmailResult> {
  const { toEmail, einreicherVorname, vereinName } = params

  try {
    await getResend().emails.send({
      from: FROM,
      to: [toEmail],
      subject: `Deine Einreichung für ${vereinName} ist eingegangen`,
      html: emailWrapper(
        `
        ${heading('Wir haben deine Einreichung erhalten!')}
        ${paragraph(`Hallo ${einreicherVorname}, vielen Dank für das Eintragen von ${highlight(vereinName)} auf SportRise.`)}
        <div style="margin:0 0 24px;padding:20px;background-color:rgba(22,163,74,0.08);border:1px solid rgba(22,163,74,0.2);border-radius:8px;">
          <table cellpadding="0" cellspacing="0" style="width:100%;">
            <tr><td style="padding:6px 0;font-size:14px;color:#16a34a;">Verein</td><td style="padding:6px 0;font-size:14px;color:#f1f5f9;font-weight:600;">${vereinName}</td></tr>
            <tr><td style="padding:6px 0;font-size:14px;color:#94a3b8;">Status</td><td style="padding:6px 0;font-size:14px;color:#f1f5f9;">Wird geprüft</td></tr>
            <tr><td style="padding:6px 0;font-size:14px;color:#94a3b8;">Prüfzeit</td><td style="padding:6px 0;font-size:14px;color:#f1f5f9;">24–48 Stunden</td></tr>
          </table>
        </div>
        ${paragraph('Sobald wir die Angaben geprüft und freigegeben haben, erhältst du eine weitere E-Mail mit dem Link zu deinem Vereinsprofil.')}
        ${paragraph('Falls du Fragen hast oder Änderungen vornehmen möchtest, antworte einfach auf diese E-Mail.')}
        `,
        `Deine Einreichung für ${vereinName} ist eingegangen – Prüfung innerhalb von 24–48 Stunden.`,
      ),
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}


// ── Turnier Einreichung Bestätigung (an Einreicher) ─────────────

export async function sendTurnierEinreichungBestaetigung(params: {
  toEmail: string
  einreicherVorname: string
  turnierName: string
}): Promise<EmailResult> {
  const { toEmail, einreicherVorname, turnierName } = params

  try {
    await getResend().emails.send({
      from: FROM,
      to: [toEmail],
      subject: `Deine Turnier-Einreichung für ${turnierName} ist eingegangen`,
      html: emailWrapper(
        `
        ${heading('Wir haben deine Einreichung erhalten!')}
        ${paragraph(`Hallo ${einreicherVorname}, vielen Dank für das Eintragen von ${highlight(turnierName)} auf SportRise.`)}
        <div style="margin:0 0 24px;padding:20px;background-color:rgba(22,163,74,0.08);border:1px solid rgba(22,163,74,0.2);border-radius:8px;">
          <table cellpadding="0" cellspacing="0" style="width:100%;">
            <tr><td style="padding:6px 0;font-size:14px;color:#16a34a;">Turnier</td><td style="padding:6px 0;font-size:14px;color:#f1f5f9;font-weight:600;">${turnierName}</td></tr>
            <tr><td style="padding:6px 0;font-size:14px;color:#94a3b8;">Status</td><td style="padding:6px 0;font-size:14px;color:#f1f5f9;">Wird geprüft</td></tr>
            <tr><td style="padding:6px 0;font-size:14px;color:#94a3b8;">Prüfzeit</td><td style="padding:6px 0;font-size:14px;color:#f1f5f9;">24–48 Stunden</td></tr>
          </table>
        </div>
        ${paragraph('Sobald wir die Angaben geprüft und freigegeben haben, erhältst du eine weitere E-Mail mit dem Link zu deinem Turnier.')}
        ${paragraph('Falls du Fragen hast oder Änderungen vornehmen möchtest, antworte einfach auf diese E-Mail.')}
        `,
        `Deine Einreichung für ${turnierName} ist eingegangen – Prüfung innerhalb von 24–48 Stunden.`,
      ),
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

// ── Turnier verifiziert (an Einreicher nach Admin-Bestätigung) ───

export async function sendTurnierVerifiziertEmail(params: {
  toEmail: string
  einreicherVorname: string
  turnierName: string
  turnierSlug: string
}): Promise<EmailResult> {
  const { toEmail, einreicherVorname, turnierName, turnierSlug } = params
  const turnierLink = `${APP_URL}/turniere/${turnierSlug}`

  try {
    await getResend().emails.send({
      from: FROM,
      to: [toEmail],
      subject: `${turnierName} wurde verifiziert und ist jetzt live!`,
      html: emailWrapper(
        `
        ${heading('Dein Turnier ist live!')}
        ${paragraph(`Hallo ${einreicherVorname}, ${highlight(turnierName)} wurde erfolgreich geprüft und ist jetzt auf SportRise sichtbar.`)}
        ${paragraph('Das Turnier erscheint jetzt in der Turniersuche und Sportler in deiner Region können sich anmelden.')}
        <div style="text-align:center;">
          ${button(turnierLink, 'Turnier ansehen')}
        </div>
        `,
        `${turnierName} wurde auf SportRise verifiziert und ist jetzt live.`,
      ),
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

// ── Turnier abgelehnt (an Einreicher nach Admin-Ablehnung) ───────

export async function sendTurnierAbgelehntEmail(params: {
  toEmail: string
  einreicherVorname: string
  turnierName: string
  reason?: string
}): Promise<EmailResult> {
  const { toEmail, einreicherVorname, turnierName, reason } = params
  const supportLink = `${APP_URL}/kontakt`

  try {
    await getResend().emails.send({
      from: FROM,
      to: [toEmail],
      subject: `Turnier-Einreichung für ${turnierName} wurde abgelehnt`,
      html: emailWrapper(
        `
        ${heading('Einreichung konnte nicht bestätigt werden')}
        ${paragraph(`Hallo ${einreicherVorname}, die Einreichung von ${highlight(turnierName)} konnte leider nicht bestätigt werden.`)}
        ${reason ? `<div style="margin:0 0 16px;padding:16px;background-color:rgba(239,68,68,0.08);border-left:3px solid #ef4444;border-radius:4px;">${paragraph(`Grund: ${reason}`)}</div>` : ''}
        ${paragraph('Falls du Fragen hast oder die Einreichung korrigieren möchtest, kontaktiere uns bitte. Wir helfen dir gerne weiter.')}
        <div style="text-align:center;">
          ${button(supportLink, 'Support kontaktieren')}
        </div>
        `,
        `Die Turnier-Einreichung für ${turnierName} wurde abgelehnt.`,
      ),
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}

export async function sendSparringRequestEmail(params: {
  toEmail: string
  toName: string
  fromName: string
  sport: string
  nachricht?: string
  profilLink: string
}): Promise<EmailResult> {
  const { toEmail, toName, fromName, sport, nachricht, profilLink } = params

  try {
    await getResend().emails.send({
      from: FROM,
      to: [toEmail],
      subject: `${fromName} mochte mit dir sparren`,
      html: emailWrapper(
        `
        ${heading('Neue Sparring-Anfrage')}
        ${paragraph(`Hallo ${toName}, ${highlight(fromName)} hat dich zu einem ${sport}-Sparring eingeladen.`)}
        ${nachricht ? `<div style="margin:0 0 24px;padding:20px;background-color:rgba(255,255,255,0.04);border-radius:8px;border-left:3px solid #16a34a;">${paragraph(`"${nachricht}"`)}</div>` : ''}
        ${paragraph('Schau dir das Profil an und entscheide, ob du annehmen mochtest.')}
        <div style="text-align:center;">
          ${button(profilLink, 'Profil ansehen')}
        </div>
        `,
        `${fromName} mochte mit dir im ${sport} sparren.`,
      ),
    })
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Fehler',
    }
  }
}
