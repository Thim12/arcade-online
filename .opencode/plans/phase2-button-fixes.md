# Phase 2: Button/Link-Probleme beheben

## 2.1 Sidebar Links reparieren (`components/dashboard/Sidebar.tsx`)

### PROBLEM
Die Sidebar verlinkt auf Routes die nicht existieren:
- `/dashboard/training` -> existiert nicht (sollte `/training` sein)
- `/dashboard/vereine` -> existiert nicht (sollte `/vereine` sein)
- `/dashboard/turniere` -> existiert nicht (sollte `/turniere` sein)
- `/dashboard/community` -> existiert nicht (sollte `/community` sein)
- `/dashboard/ernaehrung` -> existiert nicht (sollte `/ernaehrung/plan-erstellen` sein)

### FIX
Ersetze in `Sidebar.tsx` Zeilen 48-63:

```typescript
// VORHER (FALSCH):
const MAIN_NAV: NavItem[] = [
  { href: '/dashboard',              Icon: LayoutDashboard, label: 'Übersicht'  },
  { href: '/dashboard/training',     Icon: Dumbbell,        label: 'Training'   },
  { href: '/dashboard/ki-trainer',   Icon: Brain,           label: 'KI-Trainer' },
  { href: '/dashboard/ernaehrung',   Icon: Salad,           label: 'Ernährung'  },
]

const SPORT_NAV: NavItem[] = [
  { href: '/dashboard/vereine',    Icon: MapPin,  label: 'Vereine'    },
  { href: '/dashboard/turniere',   Icon: Trophy,  label: 'Turniere'   },
  { href: '/dashboard/community',  Icon: Users,   label: 'Community'  },
]

// NACHHER (KORREKT):
const MAIN_NAV: NavItem[] = [
  { href: '/dashboard',              Icon: LayoutDashboard, label: 'Übersicht'  },
  { href: '/training',                Icon: Dumbbell,        label: 'Training'   },
  { href: '/dashboard/ki-trainer',    Icon: Brain,           label: 'KI-Trainer' },
  { href: '/ernaehrung/plan-erstellen', Icon: Salad,         label: 'Ernährung'  },
]

const SPORT_NAV: NavItem[] = [
  { href: '/vereine',             Icon: MapPin,  label: 'Vereine'    },
  { href: '/turniere',            Icon: Trophy,  label: 'Turniere'   },
  { href: '/community',           Icon: Users,   label: 'Community'  },
]
```

Die `isActive()`-Funktion in der Sidebar muss auch angepasst werden, da die Pfade jetzt kürzer sind und mehr Unterpfaden matchen koennten. Die aktuelle Logik ist:

```typescript
function isActive(href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard'
  return pathname.startsWith(href)
}
```

Das sollte weiterhin korrekt funktionieren, da `/training` nur auf `/training*` matcht.

## 2.2 DashboardTopBar Benachrichtigungen (`components/dashboard/DashboardTopBar.tsx`)

### PROBLEM
Benachrichtigungsglocke verlinkt auf `/dashboard/benachrichtigungen` -- Route existiert nicht.

### FIX
In `DashboardTopBar.tsx` Zeile 132-133, aendere:

```typescript
// VORHER:
<Link href="/dashboard/benachrichtigungen" ...>

// NACHHER:
<Link href="/benachrichtigungen" ...>
```

## 2.3 Passwort-vergessen Route (`app/login/LoginClient.tsx`)

### PROBLEM
"Passwort vergessen?" Link verweist auf `/passwort-vergessen` -- Route existiert nicht.

### FIX
Option A (empfohlen): Erstelle einen Redirect von `/passwort-vergessen` nach `/in-arbeit`:

**Neue Datei: `app/passwort-vergessen/page.tsx`**
```typescript
import { redirect } from 'next/navigation'

export default function PasswortVergessenPage() {
  redirect('/in-arbeit')
}
```

Option B: Aendere den Link in `LoginClient.tsx` direkt auf `/in-arbeit`:

```typescript
// VORHER (Zeile ~508):
<Link href="/passwort-vergessen" ...>

// NACHHER:
<Link href="/in-arbeit" ...>
```

Ich empfehle Option A (Redirect), da `/passwort-vergessen` eine bessere UX bietet - wenn wir spaeter die Funktion implementieren, muessen wir nur die Redirect-Seite aendern.

## 2.4 Navbar Dropdown Links (`components/layout/Navbar.tsx`)

### PROBLEM
Das User-Dropdown hat einen Link `"KI-Assistent"` der auf `/in-arbeit` zeigt. Das ist OK als Coming-Soon, aber der Mobil-Link zeigt auch auf `/in-arbeit`.

### FIX
Kein Fix notwendig - `/in-arbeit` ist korrekt als temporiere Loesung fuer noch nicht implementierte Features. Die InArbeitClient-Seite kommuniziert klar, dass das Feature in Entwicklung ist.

## 2.5 Leaderboard / Level / Sparring Seiten

### PROBLEM
Diese Seiten existieren bereits als eigene Routes (`/leaderboard`, `/level`, `/sparring`) und sind funktional. Kein Fix notwendig.

## Zusammenfassung der zu aendernden Dateien:

1. `components/dashboard/Sidebar.tsx` - 4 Links korrigieren
2. `components/dashboard/DashboardTopBar.tsx` - 1 Link korrigieren  
3. `app/passwort-vergessen/page.tsx` - NEUE DATEI (Redirect nach /in-arbeit)
4. `app/login/LoginClient.tsx` - KEINE AENDERUNG noetig (Link bleibt /passwort-vergessen, Redirect erledigt es)