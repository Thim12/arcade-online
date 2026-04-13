// ─────────────────────────────────────────────────────────────────
// app/api/vereine/[id]/ablehnen/route.ts
//
// GET /api/vereine/[id]/ablehnen?token=<confirmToken>
//
// Admin klickt auf "Ablehnen"-Link in der EmailJS-Admin-Mail.
// Verein wird auf REJECTED gesetzt, Einreicher erhält E-Mail.
// ─────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendVereinRejectionEmail } from '@/lib/resend'

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
      status: true,
      confirmToken: true,
      submitterEmail: true,
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
      '<div class="icon">!</div><h1>Ungültiger Token</h1><p>Der Link ist ungültig oder abgelaufen.</p>',
      '#EF4444',
    )
  }

  // Bereits abgelehnt?
  if (verein.status === 'REJECTED') {
    return htmlPage(
      'Bereits abgelehnt',
      `<div class="icon">-</div><h1>Bereits abgelehnt</h1><p>${verein.name} wurde bereits abgelehnt.</p>`,
      '#EF4444',
    )
  }

  // Auf REJECTED setzen
  await prisma.verein.update({
    where: { id: verein.id },
    data: {
      status: 'REJECTED',
      isVerified: false,
      confirmToken: null,
    },
  })

  // Ablehnungs-E-Mail an Einreicher
  if (verein.submitterEmail) {
    await sendVereinRejectionEmail({
      toEmail: verein.submitterEmail,
      vereinName: verein.name,
    })
  }

  return htmlPage(
    'Einreichung abgelehnt',
    `<div class="icon" style="color:#EF4444;font-size:28px">&#10005;</div>
     <h1>Einreichung abgelehnt</h1>
     <p><strong style="color:#F1F5F9">${verein.name}</strong> wurde abgelehnt und nicht veröffentlicht.</p>
     <p style="margin-top:8px">Der Einreicher wurde per E-Mail informiert.</p>`,
    '#EF4444',
  )
}
