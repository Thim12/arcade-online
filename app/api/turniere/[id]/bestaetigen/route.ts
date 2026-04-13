// ─────────────────────────────────────────────────────────────────
// app/api/turniere/[id]/bestaetigen/route.ts
//
// GET /api/turniere/[id]/bestaetigen?token=...
// Admin-Link: Turnier wird verifiziert, published und REGISTRATION_OPEN.
// Wenn Einreicher einen SportRise-Account hat: +200 XP.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendTurnierVerifiziertEmail } from '@/lib/resend'
import { awardXP } from '@/lib/xp'

const htmlPage = (title: string, body: string, color: string) => `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} – SportRise</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0A0A0A; color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 24px; }
    .card { max-width: 480px; width: 100%; background: #1e293b; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; overflow: hidden; }
    .header { background: ${color}; padding: 32px; text-align: center; }
    .header h1 { font-size: 22px; font-weight: 700; }
    .content { padding: 32px; }
    p { color: #94a3b8; font-size: 15px; line-height: 1.6; margin-bottom: 16px; }
    a.btn { display: inline-block; background: ${color}; color: #fff; font-size: 14px; font-weight: 600; text-decoration: none; padding: 12px 24px; border-radius: 8px; margin-top: 8px; }
    .footer { padding: 16px 32px; border-top: 1px solid rgba(255,255,255,0.06); text-align: center; font-size: 12px; color: #475569; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header"><h1>${title}</h1></div>
    <div class="content">${body}</div>
    <div class="footer">SportRise.de &mdash; Kostenlos. Werbefrei.</div>
  </div>
</body>
</html>`

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const { id } = params
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return new NextResponse(
      htmlPage('Ungültiger Link', '<p>Kein Token angegeben.</p>', '#EF4444'),
      { status: 400, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }

  const tournament = await prisma.tournament.findUnique({ where: { id } })

  if (!tournament || tournament.confirmToken !== token) {
    return new NextResponse(
      htmlPage('Ungültiger Link', '<p>Das Turnier wurde nicht gefunden oder der Token ist ungültig.</p>', '#EF4444'),
      { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }

  if (tournament.isVerified) {
    return new NextResponse(
      htmlPage(
        'Bereits bestätigt',
        `<p>${tournament.name} wurde bereits bestätigt und ist live.</p><a href="${process.env.NEXTAUTH_URL ?? 'https://sportrise.de'}/turniere/${tournament.slug}" class="btn">Turnier ansehen</a>`,
        '#16A34A',
      ),
      { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
    )
  }

  // Turnier bestätigen
  await prisma.tournament.update({
    where: { id },
    data: {
      isVerified: true,
      isPublished: true,
      status: 'REGISTRATION_OPEN',
    },
  })

  // +200 XP an Einreicher (falls SportRise-Account vorhanden)
  if (tournament.submittedByUserId) {
    try {
      await awardXP(tournament.submittedByUserId, 200, prisma)
    } catch {
      // XP-Fehler nicht kritisch
    }
  }

  // Bestätigungsmail an Einreicher
  if (tournament.submitterEmail) {
    const einreicherVorname = tournament.submitterName?.split(' ')[0] ?? 'Hallo'
    await sendTurnierVerifiziertEmail({
      toEmail: tournament.submitterEmail,
      einreicherVorname,
      turnierName: tournament.name,
      turnierSlug: tournament.slug,
    })
  }

  const appUrl = process.env.NEXTAUTH_URL ?? 'https://sportrise.de'

  return new NextResponse(
    htmlPage(
      'Turnier verifiziert',
      `<p><strong style="color:#f1f5f9;">${tournament.name}</strong> wurde erfolgreich bestätigt und ist jetzt auf SportRise live.</p><p>Eine Benachrichtigung wurde an den Einreicher gesendet.</p><a href="${appUrl}/turniere/${tournament.slug}" class="btn">Turnier ansehen</a>`,
      '#16A34A',
    ),
    { status: 200, headers: { 'Content-Type': 'text/html; charset=utf-8' } },
  )
}
