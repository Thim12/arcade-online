# SportRise.de - Vollstaendiger Umsetzungsplan

## STATUS: Plan-Modus aktiv - Dateiaenderungen noch nicht gestartet

---

## Phase 1: Build-Fehler beheben [ERLEDIGT]

Die supabase.ts Separation existiert bereits:
- `lib/supabase-server.ts` - Server-Only (mit next/headers)
- `lib/supabase-client.ts` - Browser-Only (ohne next/headers)
- Kein Code importiert mehr das alte `lib/supabase.ts`

`next build` erfolgreich, `tsc --noEmit` ohne Fehler.

---

## Phase 2: Button/Link-Probleme beheben [AUFGEREIT]

### 2.1 Sidebar Links reparieren
**Datei:** `components/dashboard/Sidebar.tsx`
**Aenderung:** 4 Links von `/dashboard/*` auf korrekte Root-Level-Pfade

| Alt (falsch) | Neu (korrekt) |
|---|---|
| `/dashboard/training` | `/training` |
| `/dashboard/ernaehrung` | `/ernaehrung/plan-erstellen` |
| `/dashboard/vereine` | `/vereine` |
| `/dashboard/turniere` | `/turniere` |
| `/dashboard/community` | `/community` |

### 2.2 DashboardTopBar Benachrichtigungen
**Datei:** `components/dashboard/DashboardTopBar.tsx`
**Aenderung:** Link von `/dashboard/benachrichtigungen` auf `/benachrichtigungen`

### 2.3 Passwort-vergessen Redirect
**Neue Datei:** `app/passwort-vergessen/page.tsx`
**Inhalt:** Redirect nach `/in-arbeit`

---

## Phase 3: CSS Design-System komplett neu aufbauen [AUFGEREIT]

### Datei: `app/globals.css`

Kompletter Neubau des CSS-Design-Systems auf Nike/Spotify/Linear/Whoop Niveau:

1. **Dark-Mode-First Root Variables** - Tiefe, satte Farben wie Spotify/Linear
2. **Sport-Farbsystem via `data-sport`** - Automatische Farbwechsel pro Sportart
3. **Custom Properties** fuer --sport-primary, --sport-secondary, --sport-accent, --sport-glow
4. **Glassmorphism Utilities** - .glass, .glass-card, .glass-darker
5. **Gradient-Hero Utilities** - .hero-overlay, .text-gradient-sport
6. **Glow-Shadow System** - .glow-sport, .glow-green, sport-glow shadows
7. **Premium Animation Keyframes** - fadeIn, slideUp, scaleIn, shimmer, float, glowPulse
8. **Custom Scrollbar** schmale, dunkle Scrollbars
9. **Focus-Ring System** in --sport-primary
10. **Card Hover Effects** - translateY(-2px) + sport-glow shadow
11. **Button System** - .btn-primary, .btn-secondary, .btn-ghost mit sport-colors
12. **Radius System** - 6px mini / 8px buttons / 12px cards / 16px gross / 9999px pills

### Datei: `tailwind.config.ts`

1. Alle custom colors (fussball, tennis, basketball) mit light/dark/glow Varianten
2. Custom shadows: glow-green, glow-orange-clay, glow-orange-basket, sport
3. Custom animations: fade-in, slide-up, scale-in, shimmer, float, glow-pulse
4. Font: Inter via next/font/google (bereits in layout.tsx)
5. Dark mode: class strategy (bereits konfiguriert)

---

## Phase 4: Component-Redesign [AUFGEREIT]

### 4.1 Navbar (`components/layout/Navbar.tsx`)
- Premium dark glassmorphism Header
- Sport-Farbsystem fuer aktiven Link
- Hover: translateY(-2px) + sport-glow
- Notification Popover: Dark glassmorphism statt weiss
- User-Dropdown: Dark premium design

### 4.2 HeroSection (`components/home/HeroSection.tsx`)
- Apple-product-page Level Hero
- "Anmelden" Button hinzufuegen (neben "Registrieren")
- Gradient-Overlay Perfektionieren
- CTA-Buttons mit glow-pulse Animation

### 4.3 Login (`app/login/LoginClient.tsx`)
- "Passwort vergessen?" Link -> `/passwort-vergessen` (wird zu /in-arbeit redirect)
- Premium dark+white split design beibehalten aber verfeinern
- Sport-Farbsystem integrieren

### 4.4 Sidebar (`components/dashboard/Sidebar.tsx`)
- Links korrigieren (Phase 2)
- Dark glassmorphism Premium-Design
- Sport-color accent fuer aktiven Link
- Hover-Animation: subtle glow

### 4.5 DashboardTopBar (`components/dashboard/DashboardTopBar.tsx`)
- Link korrigieren (Phase 2)
- Sport-color greeting text
- Premium glassmorphism

### 4.6 Alle Home-Sektionen
- SportartenSection: Sportfarb-Karten mit data-sport Attribut
- FeaturesSection: Dark premium grid
- WieEsFunktioniertSection: Alternierende L/R mit sport-accents
- GamificationSection: Dark mit sport-glow
- TestimonialsSection: Dark glassmorphism
- FinalCtaSection: Kraftvoller gradient CTA

### 4.7 Footer (`components/layout/Footer.tsx`)
- Dark premium footer mit sport-color accents
- KI-Hinweis sichtbarer

### 4.8 Dashboard-Seiten
- Alle Dashboard-Seiten: Whoop-artiges Dashboard-Design
- Sport-Farbsystem aktivieren pro Seite

### 4.9 In-Arbeit Seite
- Premium Coming-Soon-Seite mit dark design

---

## Phase 5: TypeScript-Check & Validierung [AUFGEREIT]

1. `tsc --noEmit` muss 0 Fehler haben
2. Alle Links manuell per Dev-Server pruefen
3. Alle Button onClicks pruefen
4. Edge Cases validieren (leere DB, ausgeloggt, API-Fehler)

---

## WICHTIGE META-ANweisungen (ZUSAMMENGEFASST):

1. Keine Emoji - nur Lucide React Icons + eigene SVGs im JSX
2. Alle Texte Deutsch
3. TypeScript strict, kein any, kein TODO
4. next.config.mjs: params in page.tsx synchron (kein Promise)
5. Kein recharts - Charts als reine SVGs
6. KI-Features: Eigen programmiert in /lib/ai/, sichtbar im UI: "Erstellt von unserer eigenen KI · kein externer Bot · DSGVO-konform"
7. Sport-Farbsystem via data-sport: fussball #16A34A, tennis #C2621A, basketball #EA580C
8. Hover: translateY(-2px) oder scale(1.02) + Box-Shadow in sport-glow
9. Glassmorphism: bg-white/10 backdrop-blur-md border-white/20
10. Framer Motion fuer alle Animationen
11. Mobile-First, vollstaendig responsive
12. try/catch in jeder async-Funktion
13. Loading, Empty, Error States immer vorhanden