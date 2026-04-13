# SportRise — Deployment-Checkliste

Vollständige Checkliste für alle Punkte, die vor dem Launch geprüft werden müssen.
Stand: April 2026. Alle Umgebungsvariablen müssen in Vercel **Production** gesetzt sein.

---

## 1. Infrastruktur & Datenbank

### Supabase

- [ ] Supabase-Projekt befindet sich in Region **`aws-0-eu-central-1` (Frankfurt)** — DSGVO-Pflicht
- [ ] **Row Level Security (RLS)** ist für alle Tabellen aktiviert (Supabase Dashboard → Table Editor → RLS)
- [ ] Storage Buckets angelegt:
  - [ ] `avatars` — öffentlich lesbar, nur Eigentümer kann schreiben
  - [ ] `verein-logos` — öffentlich lesbar, nur ADMIN kann schreiben
  - [ ] `posts-media` — öffentlich lesbar, nur Eigentümer kann schreiben
  - [ ] `diary-media` — nur Eigentümer kann lesen und schreiben (privat)
- [ ] Storage Policies für alle Buckets konfiguriert (kein öffentlicher Schreibzugriff)
- [ ] `DATABASE_URL` enthält `?pgbouncer=true&connection_limit=1` für Connection-Pooling via PgBouncer
- [ ] `DIRECT_URL` zeigt ohne Pooler direkt auf die Supabase DB (für Prisma-Migrationen)
- [ ] Datenbankverbindung mit `prisma db push --preview-feature` auf Prod-DB getestet
- [ ] `prisma generate` lokal ausgeführt, generierter Client ist aktuell

### Vercel

- [ ] Projekt mit GitHub-Repository verknüpft (Auto-Deploy auf `main`)
- [ ] **Cron-Job** konfiguriert: Route `/api/cron/turnier-check`, Schedule `0 8 * * *` (täglich 08:00 UTC)
- [ ] Alle unten aufgelisteten Environment-Variablen in Vercel **Production** gesetzt
- [ ] Build-Log geprüft: **keine TypeScript-Fehler**, `next build` lokal ohne Fehler
- [ ] `next build` lokal mit `NODE_ENV=production` ausgeführt und erfolgreich abgeschlossen

---

## 2. Umgebungsvariablen

Alle Variablen müssen in Vercel unter **Settings → Environment Variables → Production** gesetzt sein.

### Datenbank

- [ ] `DATABASE_URL` — Supabase Connection-Pooler-URL mit `?pgbouncer=true`
- [ ] `DIRECT_URL` — Supabase direkte DB-URL (ohne Pooler, für Migrationen)

### NextAuth / Authentifizierung

- [ ] `NEXTAUTH_SECRET` — generiert mit `openssl rand -base64 32` (mind. 32 Zeichen)
- [ ] `NEXTAUTH_URL` — Produktions-URL: `https://sportrise.de`
- [ ] `AUTH_GOOGLE_ID` — Google OAuth Client ID
- [ ] `AUTH_GOOGLE_SECRET` — Google OAuth Client Secret

### Cron-Jobs

- [ ] `CRON_SECRET` — generiert mit `openssl rand -base64 32`, in Vercel und in Cron-Header gesetzt

### Google Maps

- [ ] `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — API-Key (siehe Abschnitt 5)

### KI (Gemini)

- [ ] `GEMINI_API_KEY` — Google AI Studio API-Key

### E-Mail

- [ ] `RESEND_API_KEY` — Resend API-Key (Production-Key, nicht Test-Key)
- [ ] `RESEND_FROM_EMAIL` — `noreply@sportrise.de`
- [ ] `ADMIN_EMAIL` — E-Mail-Adresse für Admin-Benachrichtigungen

### App-Konfiguration

- [ ] `NEXT_PUBLIC_APP_URL` — `https://sportrise.de`

---

## 3. Authentifizierung & Sicherheit

### Google OAuth (Google Cloud Console)

- [ ] OAuth-App unter `console.cloud.google.com` konfiguriert
- [ ] Autorisierte Redirect-URIs eingetragen:
  - [ ] `https://sportrise.de/api/auth/callback/google`
  - [ ] `http://localhost:3000/api/auth/callback/google` (nur für Development)
- [ ] OAuth-Consent-Screen ausgefüllt (App-Name, Logo, Privacy Policy URL, Terms of Service URL)
- [ ] App-Status auf **Production** gesetzt (nicht "Testing"), sonst können nur Test-User sich anmelden

### NextAuth

- [ ] `NEXTAUTH_SECRET` ist stark genug (mind. 32 zufällige Bytes)
- [ ] Session-Strategie auf `jwt` gesetzt (kein Datenbankadapter für Sessions nötig)
- [ ] Callback-URLs in `authConfig` stimmen mit Prod-Domain überein

### Admin-Schutz

- [ ] Middleware schützt `/admin/*` — nur User mit `role: 'ADMIN'`
- [ ] Mind. ein Admin-User in der Datenbank gesetzt: `UPDATE "User" SET role = 'ADMIN' WHERE email = 'admin@sportrise.de';`

### Rate-Limiting (optional aber empfohlen)

- [ ] Rate-Limiting für `/api/auth/signin` implementiert oder Upstash Redis konfiguriert
- [ ] Brute-Force-Schutz für Login-Endpunkte vorhanden

---

## 4. E-Mail — Resend

- [ ] Domain `sportrise.de` bei Resend verifiziert (DNS-Einträge gesetzt und propagiert)
  - [ ] SPF-Eintrag gesetzt
  - [ ] DKIM-Eintrag gesetzt
  - [ ] DMARC-Eintrag gesetzt (empfohlen: `p=quarantine`)
- [ ] `RESEND_FROM_EMAIL` auf `noreply@sportrise.de` gesetzt
- [ ] Alle 5 E-Mail-Templates getestet:
  - [ ] Eltern-Einwilligungs-E-Mail (Nutzer unter 13)
  - [ ] Willkommens-E-Mail nach Registrierung
  - [ ] Verein-Bestätigung (Verein wurde verifiziert)
  - [ ] Verein-Ablehnung (Verein wurde abgelehnt)
  - [ ] Turnier-Bestätigung (Anmeldung erfolgreich)
- [ ] Test-E-Mail an `ADMIN_EMAIL` gesendet und empfangen

---

## 5. Google Maps

- [ ] Google Maps API-Key unter `console.cloud.google.com` erstellt
- [ ] API-Key auf folgende **APIs beschränkt**:
  - [ ] Maps JavaScript API
  - [ ] Geocoding API
  - [ ] Places API (falls Adress-Autocomplete genutzt wird)
- [ ] API-Key auf **HTTP-Referrer** eingeschränkt: `https://sportrise.de/*`
- [ ] **Daily Quota** (Tages-Limit) gesetzt um unkontrollierte Kosten zu verhindern (empfohlen: 1.000 Anfragen/Tag)
- [ ] Billing-Alert in Google Cloud Console gesetzt (z.B. bei 50 €)

---

## 6. Next.js & Build

- [ ] `typescript.ignoreBuildErrors: false` in `next.config.mjs` — Build schlägt bei TypeScript-Fehlern fehl
- [ ] `next build` lokal ohne Fehler und Warnungen
- [ ] `tsc --noEmit` gibt 0 Fehler zurück
- [ ] Alle `console.log`-Debugging-Ausgaben entfernt oder auf `process.env.NODE_ENV === 'development'` beschränkt
- [ ] Security-Headers in `next.config.mjs` gesetzt:
  - [ ] `X-Frame-Options: DENY`
  - [ ] `X-Content-Type-Options: nosniff`
  - [ ] `Referrer-Policy: strict-origin-when-cross-origin`
  - [ ] `Permissions-Policy: camera=(), microphone=(), geolocation=(self)`
  - [ ] `Content-Security-Policy` konfiguriert
- [ ] `images.remotePatterns` enthält alle genutzten externen Bild-Domains
- [ ] Sitemap (`/sitemap.xml`) ist erreichbar und enthält alle wichtigen Routen
- [ ] Robots.txt (`/robots.txt`) ist erreichbar und blockiert `/admin`, `/api`, `/dashboard`

---

## 7. Performance & SEO

- [ ] Lighthouse-Score auf Startseite: Performance ≥ 90, SEO = 100, Accessibility ≥ 90
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Alle `<Image>`-Komponenten haben `alt`-Attribute und `sizes`-Props
- [ ] OG-Image (`/og-image.png`) existiert und hat Maße 1200×630 px
- [ ] `<title>` und `<meta description>` für alle öffentlichen Seiten gesetzt
- [ ] Canonical-URLs korrekt (kein doppelter Content)
- [ ] `hreflang="de"` in Layout-Metadata gesetzt (`locale: 'de_DE'`)

---

## 8. DSGVO & Datenschutz

- [ ] Datenschutzerklärung unter `/datenschutz` erreichbar und aktuell
- [ ] Impressum unter `/impressum` mit vollständigen Pflichtangaben gemäß § 5 TMG
- [ ] AGB unter `/agb` mit Mindestalter, Jugendschutz und Community-Regeln
- [ ] Kein US-Cloud-Tracking (kein Google Analytics, kein Facebook Pixel)
- [ ] Vercel Analytics: anonymisiert, keine Cookies, DSGVO-konform
- [ ] Supabase in Region EU Frankfurt (`aws-0-eu-central-1`) bestätigt
- [ ] Nutzer-Datenlöschung funktioniert (Test: Konto anlegen und löschen)
- [ ] Konto-Export (Datenschutz Art. 20) implementiert oder dokumentiert
- [ ] Eltern-Einwilligungs-Flow für Nutzer unter 13 Jahren getestet

---

## 9. Datenbankinhalt (Seed)

- [ ] `prisma db seed` auf Produktions-Datenbank ausgeführt (oder Seed-Daten manuell eingepflegt):
  - [ ] Sportarten: Fußball, Tennis, Basketball (mit korrekten Farben und Slugs)
  - [ ] Alle Abzeichen (Badges) vorhanden, inkl. Easter-Egg-Badges
  - [ ] Mind. 5 Beispiel-Vereine im Status `VERIFIED` für den Vereinsfinder
- [ ] `ADMIN`-Role für den Haupt-Admin-Account gesetzt

---

## 10. Launch-Day-Checkliste

- [ ] DNS-Einträge für `sportrise.de` auf Vercel zeigen (A-Record oder CNAME)
- [ ] SSL/TLS-Zertifikat von Vercel ausgestellt und aktiv (automatisch via Let's Encrypt)
- [ ] Prod-URL in allen OAuth-Einstellungen aktualisiert (Google, ggf. andere Provider)
- [ ] Ersten Testnutzer registriert und gesamten Onboarding-Flow durchgespielt
- [ ] Admin-Dashboard unter `/admin` erreichbar und funktionsfähig
- [ ] Cron-Job-Endpunkt mit korrektem `CRON_SECRET`-Header manuell getestet:
  ```bash
  curl -X POST https://sportrise.de/api/cron/turnier-check \
    -H "Authorization: Bearer $CRON_SECRET"
  ```
- [ ] Error-Monitoring (z.B. Vercel Error Logs) beobachtet und erste Fehler behoben
- [ ] Backup-Strategie für Supabase-Datenbank konfiguriert (Supabase → Database → Backups)

---

## Checkliste: Schnellübersicht

| Bereich | Status |
|---|---|
| Supabase EU Frankfurt + RLS | Offen |
| Storage Buckets + Policies | Offen |
| Vercel Env-Variablen | Offen |
| Google OAuth Redirect-URIs | Offen |
| Resend Domain verifiziert | Offen |
| Google Maps API-Key eingeschränkt | Offen |
| `next build` ohne Fehler | Offen |
| Security-Headers konfiguriert | Offen |
| DSGVO-Seiten aktuell | Erledigt |
| Sitemap + Robots.txt | Erledigt |
| Seed-Daten auf Prod-DB | Offen |
| SSL + DNS konfiguriert | Offen |
