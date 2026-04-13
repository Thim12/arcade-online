// ─────────────────────────────────────────────────────────────────
// app/api/vereine/[id]/bestaetigen/route.ts
//
// GET /api/vereine/[id]/bestaetigen?token=<confirmToken>
//
// Admin klickt auf "Bestätigen"-Link in der EmailJS-Admin-Mail.
// Verein wird auf VERIFIED gesetzt, Einreicher erhält E-Mail,
// falls ein User-Account existiert wird XP vergeben.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { awardXP } from '@/lib/xp'
import {
  sendVereinConfirmationEmail,
} from '@/lib/resend'

function htmlPage(title: string, body: string, color: string): NextResponse {
  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} | SportRise</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0A0A0A;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{max-width:480px;width:100%;background:#1A1A1A;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:48px 40px;text-align:center}
    .icon{width:80px;height:80px;border-radius:50%;background:${color}22;border:2px solid ${color};display:flex;align-items:center;justify-content:center;margin:0 auto 24px;font-size:36px}
    h1{font-size:22px;font-weight:700;color:#F1F5F9;margin-bottom:12px}
    p{font-size:15px;line-height:1.6;color:#94A3B8;margin-bottom:8px}
    .btn{display:inline-block;margin-top:28px;padding:12px 28px;background:${color};color:#fff;font-size:14px;font-weight:600;text-decoration:none;border-radius:8px}
  </style>
</head>
<body>
  <div class="card">
    ${body}
    <a class="btn" href="https://sportrise.de">Zur Startseite</a>
  </div>
</body>
</html>`

  return new NextResponse(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const { id } = params
  const token = req.nextUrl.searchParams.get('token')

  if (!token) {
    return htmlPage(
      'Ungültiger Link',
      '<div class="icon">!</div><h1>Ungültiger Link</h1><p>Kein Token angegeben.</p>',
      '#EF4444',
    )
  }

  // Verein laden
  const verein = await prisma.verein.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      confirmToken: true,
      submitterEmail: true,
      submitterName: true,
    },
  })

  if (!verein) {
    return htmlPage(
      'Verein nicht gefunden',
      '<div class="icon">?</div><h1>Verein nicht gefunden</h1><p>Dieser Verein existiert nicht oder wurde bereits gelöscht.</p>',
      '#EF4444',
    )
  }

  // Token prüfen
  if (verein.confirmToken !== token) {
    return htmlPage(
      'Ungültiger Token',
      '<div class="icon">!</div><h1>Ungültiger Token</h1><p>Der Bestätigungs-Link ist ungültig oder abgelaufen.</p>',
      '#EF4444',
    )
  }

  // Bereits verifiziert?
  if (verein.status === 'VERIFIED') {
    return htmlPage(
      'Bereits verifiziert',
      `<div class="icon" style="font-size:28px">ok</div><h1>Bereits verifiziert</h1><p>${verein.name} ist bereits auf SportRise gelistet.</p>`,
      '#16A34A',
    )
  }

  // Verein auf VERIFIED setzen
  await prisma.verein.update({
    where: { id: verein.id },
    data: {
      status: 'VERIFIED',
      isVerified: true,
      verifiedAt: new Date(),
      confirmToken: null,
    },
  })

  // XP für Einreicher vergeben (wenn User-Account vorhanden)
  if (verein.submitterEmail) {
    const user = await prisma.user.findUnique({
      where: { email: verein.submitterEmail },
      select: { id: true },
    })
    if (user) {
      await awardXP(user.id, 2000, prisma)

      // Badge "Vereinsgründer" direkt vergeben (kein dedizierter BadgeAction-Typ)
      const gruenderBadge = await prisma.badge.findFirst({
        where: {
          OR: [{ name: { contains: 'Vereinsgründer' } }, { name: { contains: 'Vereinsgrunder' } }],
        },
        select: { id: true },
      })
      if (gruenderBadge) {
        await prisma.userBadge.upsert({
          where: { userId_badgeId: { userId: user.id, badgeId: gruenderBadge.id } },
          update: {},
          create: { userId: user.id, badgeId: gruenderBadge.id },
        })
      }
    }
  }

  // Bestätigungs-E-Mail an Einreicher
  if (verein.submitterEmail) {
    await sendVereinConfirmationEmail({
      toEmail: verein.submitterEmail,
      vereinName: verein.name,
      vereinSlug: verein.slug,
    })
  }

  return htmlPage(
    'Verein bestätigt',
    `<div class="icon" style="font-size:28px;color:#16A34A">&#10003;</div>
     <h1>Verein bestätigt!</h1>
     <p><strong style="color:#F1F5F9">${verein.name}</strong> ist jetzt auf SportRise sichtbar.</p>
     <p style="margin-top:8px">Der Einreicher wurde per E-Mail informiert.</p>`,
    '#16A34A',
  )
}
