import { PrismaClient, BadgeRarity, Prisma } from '@prisma/client'

const prisma = new PrismaClient()

// ─────────────────────────────────────────────────────────────────
// Typen
// ─────────────────────────────────────────────────────────────────

interface BadgeDef {
  name: string
  description: string
  iconName: string
  rarity: BadgeRarity
  xpReward: number
  isSecret: boolean
  sportSlug: string | null
  requirement: Prisma.InputJsonValue
}

// ─────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('Starte Seed...')

  // ──────────────────────────────────────────────────────────────
  // SPORTARTEN
  // ──────────────────────────────────────────────────────────────

  const fussball = await prisma.sport.upsert({
    where: { slug: 'fussball' },
    update: {
      name: 'Fußball',
      description:
        'Der beliebteste Sport Deutschlands – von Jugendteams bis zur Kreisliga. Trainiere deine Technik, finde deinen Verein und nimm an Turnieren teil.',
      iconName: 'CircleDot',
      colorPrimary: '#16A34A',
      colorLight: '#BBF7D0',
      colorGlow: 'rgba(22, 163, 74, 0.35)',
      isActive: true,
      isComingSoon: false,
      sortOrder: 1,
      sportType: 'MANNSCHAFT',
    },
    create: {
      name: 'Fußball',
      slug: 'fussball',
      description:
        'Der beliebteste Sport Deutschlands – von Jugendteams bis zur Kreisliga. Trainiere deine Technik, finde deinen Verein und nimm an Turnieren teil.',
      iconName: 'CircleDot',
      colorPrimary: '#16A34A',
      colorLight: '#BBF7D0',
      colorGlow: 'rgba(22, 163, 74, 0.35)',
      isActive: true,
      isComingSoon: false,
      sortOrder: 1,
      sportType: 'MANNSCHAFT',
    },
  })

  const tennis = await prisma.sport.upsert({
    where: { slug: 'tennis' },
    update: {
      name: 'Tennis',
      description:
        'Aufschlag, Rückhand, Netz – Tennis fordert Körper und Geist. Finde Trainingspartner, entdecke Clubs und verbessere dein Spiel.',
      iconName: 'Circle',
      colorPrimary: '#C2621A',
      colorLight: '#FDE68A',
      colorGlow: 'rgba(194, 98, 26, 0.35)',
      isActive: true,
      isComingSoon: false,
      sortOrder: 2,
      sportType: 'EINZEL',
    },
    create: {
      name: 'Tennis',
      slug: 'tennis',
      description:
        'Aufschlag, Rückhand, Netz – Tennis fordert Körper und Geist. Finde Trainingspartner, entdecke Clubs und verbessere dein Spiel.',
      iconName: 'Circle',
      colorPrimary: '#C2621A',
      colorLight: '#FDE68A',
      colorGlow: 'rgba(194, 98, 26, 0.35)',
      isActive: true,
      isComingSoon: false,
      sortOrder: 2,
      sportType: 'EINZEL',
    },
  })

  const basketball = await prisma.sport.upsert({
    where: { slug: 'basketball' },
    update: {
      name: 'Basketball',
      description:
        'Streetball oder Hallenbasketball – Basketball ist Teamwork und Spektakel. Finde dein Team, trainiere Würfe und nimm an lokalen Ligen teil.',
      iconName: 'Trophy',
      colorPrimary: '#EA580C',
      colorLight: '#FFEDD5',
      colorGlow: 'rgba(234, 88, 12, 0.35)',
      isActive: true,
      isComingSoon: false,
      sortOrder: 3,
      sportType: 'MANNSCHAFT',
    },
    create: {
      name: 'Basketball',
      slug: 'basketball',
      description:
        'Streetball oder Hallenbasketball – Basketball ist Teamwork und Spektakel. Finde dein Team, trainiere Würfe und nimm an lokalen Ligen teil.',
      iconName: 'Trophy',
      colorPrimary: '#EA580C',
      colorLight: '#FFEDD5',
      colorGlow: 'rgba(234, 88, 12, 0.35)',
      isActive: true,
      isComingSoon: false,
      sortOrder: 3,
      sportType: 'MANNSCHAFT',
    },
  })

  // Coming Soon
  await prisma.sport.upsert({
    where: { slug: 'leichtathletik' },
    update: {
      name: 'Leichtathletik',
      description: 'Laufen, Springen, Werfen – die Königsdisziplin des Sports kommt bald nach SportRise.',
      iconName: 'Zap',
      colorPrimary: '#7C3AED',
      colorLight: '#EDE9FE',
      colorGlow: 'rgba(124, 58, 237, 0.35)',
      isActive: false,
      isComingSoon: true,
      sortOrder: 4,
      sportType: 'EINZEL',
    },
    create: {
      name: 'Leichtathletik',
      slug: 'leichtathletik',
      description: 'Laufen, Springen, Werfen – die Königsdisziplin des Sports kommt bald nach SportRise.',
      iconName: 'Zap',
      colorPrimary: '#7C3AED',
      colorLight: '#EDE9FE',
      colorGlow: 'rgba(124, 58, 237, 0.35)',
      isActive: false,
      isComingSoon: true,
      sortOrder: 4,
      sportType: 'EINZEL',
    },
  })

  await prisma.sport.upsert({
    where: { slug: 'schwimmen' },
    update: {
      name: 'Schwimmen',
      description: 'Kraulen, Rücken, Brust – Schwimmen ist Ausdauer und Technik. Demnächst auf SportRise.',
      iconName: 'Waves',
      colorPrimary: '#0284C7',
      colorLight: '#E0F2FE',
      colorGlow: 'rgba(2, 132, 199, 0.35)',
      isActive: false,
      isComingSoon: true,
      sortOrder: 5,
      sportType: 'EINZEL',
    },
    create: {
      name: 'Schwimmen',
      slug: 'schwimmen',
      description: 'Kraulen, Rücken, Brust – Schwimmen ist Ausdauer und Technik. Demnächst auf SportRise.',
      iconName: 'Waves',
      colorPrimary: '#0284C7',
      colorLight: '#E0F2FE',
      colorGlow: 'rgba(2, 132, 199, 0.35)',
      isActive: false,
      isComingSoon: true,
      sortOrder: 5,
      sportType: 'EINZEL',
    },
  })

  await prisma.sport.upsert({
    where: { slug: 'volleyball' },
    update: {
      name: 'Volleyball',
      description: 'Beach oder Halle – Volleyball verbindet Team und Spannung. Bald auf SportRise.',
      iconName: 'CircleDashed',
      colorPrimary: '#D97706',
      colorLight: '#FEF3C7',
      colorGlow: 'rgba(217, 119, 6, 0.35)',
      isActive: false,
      isComingSoon: true,
      sortOrder: 6,
      sportType: 'MANNSCHAFT',
    },
    create: {
      name: 'Volleyball',
      slug: 'volleyball',
      description: 'Beach oder Halle – Volleyball verbindet Team und Spannung. Bald auf SportRise.',
      iconName: 'CircleDashed',
      colorPrimary: '#D97706',
      colorLight: '#FEF3C7',
      colorGlow: 'rgba(217, 119, 6, 0.35)',
      isActive: false,
      isComingSoon: true,
      sortOrder: 6,
      sportType: 'MANNSCHAFT',
    },
  })

  await prisma.sport.upsert({
    where: { slug: 'handball' },
    update: {
      name: 'Handball',
      description: 'Schnell, physisch, spannend – Handball ist der Hallensport Deutschlands. Kommt bald.',
      iconName: 'Hand',
      colorPrimary: '#DC2626',
      colorLight: '#FEE2E2',
      colorGlow: 'rgba(220, 38, 38, 0.35)',
      isActive: false,
      isComingSoon: true,
      sortOrder: 7,
      sportType: 'MANNSCHAFT',
    },
    create: {
      name: 'Handball',
      slug: 'handball',
      description: 'Schnell, physisch, spannend – Handball ist der Hallensport Deutschlands. Kommt bald.',
      iconName: 'Hand',
      colorPrimary: '#DC2626',
      colorLight: '#FEE2E2',
      colorGlow: 'rgba(220, 38, 38, 0.35)',
      isActive: false,
      isComingSoon: true,
      sortOrder: 7,
      sportType: 'MANNSCHAFT',
    },
  })

  await prisma.sport.upsert({
    where: { slug: 'badminton' },
    update: {
      name: 'Badminton',
      description: 'Reaktionsschnell und präzise – Badminton fordert dich auf jedem Level. Demnächst dabei.',
      iconName: 'Wind',
      colorPrimary: '#0891B2',
      colorLight: '#CFFAFE',
      colorGlow: 'rgba(8, 145, 178, 0.35)',
      isActive: false,
      isComingSoon: true,
      sortOrder: 8,
      sportType: 'EINZEL',
    },
    create: {
      name: 'Badminton',
      slug: 'badminton',
      description: 'Reaktionsschnell und präzise – Badminton fordert dich auf jedem Level. Demnächst dabei.',
      iconName: 'Wind',
      colorPrimary: '#0891B2',
      colorLight: '#CFFAFE',
      colorGlow: 'rgba(8, 145, 178, 0.35)',
      isActive: false,
      isComingSoon: true,
      sortOrder: 8,
      sportType: 'EINZEL',
    },
  })

  console.log('8 Sportarten erstellt/aktualisiert.')

  // ──────────────────────────────────────────────────────────────
  // BADGES
  // ──────────────────────────────────────────────────────────────

  const sportMap = new Map<string, string>([
    ['fussball', fussball.id],
    ['tennis', tennis.id],
    ['basketball', basketball.id],
  ])

  // ── Training (8) ────────────────────────────────────────────

  const trainingBadges: BadgeDef[] = [
    {
      name: 'Erster Schritt',
      description: 'Du hast deinen ersten Trainingsplan erstellt. Der Anfang ist gemacht.',
      iconName: 'Footprints',
      rarity: BadgeRarity.COMMON,
      xpReward: 50,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'training_plan_created' },
    },
    {
      name: '5 Sessions',
      description: '5 Trainingseinheiten abgeschlossen. Du bist dabei.',
      iconName: 'Dumbbell',
      rarity: BadgeRarity.COMMON,
      xpReward: 100,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'training_sessions', count: 5 },
    },
    {
      name: '25 Sessions',
      description: '25 Trainingseinheiten – du brennst für deinen Sport.',
      iconName: 'Flame',
      rarity: BadgeRarity.RARE,
      xpReward: 300,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'training_sessions', count: 25 },
    },
    {
      name: '100 Sessions',
      description: '100 Trainingseinheiten absolviert. Außergewöhnliche Disziplin.',
      iconName: 'Target',
      rarity: BadgeRarity.EPIC,
      xpReward: 1000,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'training_sessions', count: 100 },
    },
    {
      name: 'Iron Athlete',
      description: '365 Trainingseinheiten – ein volles Jahr Training. Du bist aus Stahl.',
      iconName: 'Shield',
      rarity: BadgeRarity.LEGENDARY,
      xpReward: 5000,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'training_sessions', count: 365 },
    },
    {
      name: 'Frühaufsteher',
      description: '10-mal vor 7 Uhr trainiert. Der frühe Athlet fängt den Erfolg.',
      iconName: 'Sunrise',
      rarity: BadgeRarity.RARE,
      xpReward: 250,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'sessions_before_hour', hour: 7, count: 10 },
    },
    {
      name: 'Nacht-Athlet',
      description: 'Du trainierst nach 21 Uhr, wenn andere schlafen. Respekt.',
      iconName: 'Moon',
      rarity: BadgeRarity.RARE,
      xpReward: 250,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'sessions_after_hour', hour: 21, count: 10 },
    },
    {
      name: 'Konsistenz',
      description: '20 Einheiten zur selben Tageszeit – dein Rhythmus ist unerschütterlich.',
      iconName: 'Repeat',
      rarity: BadgeRarity.RARE,
      xpReward: 200,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'sessions_same_time_of_day', count: 20 },
    },
  ]

  // ── Streak (4) ───────────────────────────────────────────────

  const streakBadges: BadgeDef[] = [
    {
      name: 'Erste Woche',
      description: '7 Tage am Stück trainiert. Eine Woche, eine Gewohnheit.',
      iconName: 'Calendar',
      rarity: BadgeRarity.COMMON,
      xpReward: 150,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'streak_days', days: 7 },
    },
    {
      name: 'Monats-Athlet',
      description: '30 Tage Trainingsstreak – ein ganzer Monat ohne Pause.',
      iconName: 'CalendarDays',
      rarity: BadgeRarity.EPIC,
      xpReward: 750,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'streak_days', days: 30 },
    },
    {
      name: '100-Tage-Krieger',
      description: '100 Tage Streak. Willenskraft auf einem anderen Level.',
      iconName: 'Zap',
      rarity: BadgeRarity.LEGENDARY,
      xpReward: 3000,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'streak_days', days: 100 },
    },
    {
      name: 'Jahres-Champion',
      description: '365 Tage ohne Unterbrechung. Du hast ein Jahr lang nicht aufgehört.',
      iconName: 'Crown',
      rarity: BadgeRarity.LEGENDARY,
      xpReward: 10000,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'streak_days', days: 365 },
    },
  ]

  // ── Recovery (2) ─────────────────────────────────────────────

  const recoveryBadges: BadgeDef[] = [
    {
      name: 'Gut ausgeruht',
      description: '7 Regenerations-Einträge gemacht. Erholung ist Teil des Trainings.',
      iconName: 'BedDouble',
      rarity: BadgeRarity.COMMON,
      xpReward: 50,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'recovery_logs', count: 7 },
    },
    {
      name: 'Regenerations-Profi',
      description: '30 Regenerations-Einträge – du weißt, wie wichtig Erholung ist.',
      iconName: 'Activity',
      rarity: BadgeRarity.RARE,
      xpReward: 300,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'recovery_logs', count: 30 },
    },
  ]

  // ── Ernährung (5) ────────────────────────────────────────────

  const nutritionBadges: BadgeDef[] = [
    {
      name: 'Erste Mahlzeit',
      description: 'Deine erste Mahlzeit eingetragen. Ernährung ist die halbe Miete.',
      iconName: 'Utensils',
      rarity: BadgeRarity.COMMON,
      xpReward: 50,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'meal_logged', count: 1 },
    },
    {
      name: 'Wasser-Athlet',
      description: '7 Tage lang dein Wasserziel erreicht. Hydriert und fokussiert.',
      iconName: 'Droplets',
      rarity: BadgeRarity.COMMON,
      xpReward: 75,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'water_goal_days', count: 7 },
    },
    {
      name: 'Ernährungs-Profi',
      description: '100 Mahlzeiten eingetragen. Du weißt genau, was du dir gibst.',
      iconName: 'Apple',
      rarity: BadgeRarity.RARE,
      xpReward: 400,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'meals_logged', count: 100 },
    },
    {
      name: 'Meal-Prep-König',
      description: '30 Tage lang deinen Ernährungsplan befolgt. Disziplin auf dem Teller.',
      iconName: 'ChefHat',
      rarity: BadgeRarity.EPIC,
      xpReward: 800,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'nutrition_plan_followed_days', count: 30 },
    },
    {
      name: 'Kalorien-Kenner',
      description: '50 Mahlzeiten eingetragen – du trackst konsequent.',
      iconName: 'Calculator',
      rarity: BadgeRarity.COMMON,
      xpReward: 75,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'meals_logged', count: 50 },
    },
  ]

  // ── Sozial (7) ───────────────────────────────────────────────

  const socialBadges: BadgeDef[] = [
    {
      name: 'Erster Post',
      description: 'Du hast deinen ersten Beitrag in der Community verfasst. Willkommen.',
      iconName: 'PenSquare',
      rarity: BadgeRarity.COMMON,
      xpReward: 50,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'post_created', count: 1 },
    },
    {
      name: 'Viel Resonanz',
      description: '100 Likes auf deinen Beiträgen – deine Community liebt dich.',
      iconName: 'Heart',
      rarity: BadgeRarity.RARE,
      xpReward: 300,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'post_likes_received', count: 100 },
    },
    {
      name: '50 Follower',
      description: '50 Sportler folgen dir – du bist eine Inspiration.',
      iconName: 'Users',
      rarity: BadgeRarity.RARE,
      xpReward: 500,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'followers_reached', count: 50 },
    },
    {
      name: '100 Follower',
      description: '100 Follower – du bist ein fester Teil der SportRise-Community.',
      iconName: 'Star',
      rarity: BadgeRarity.EPIC,
      xpReward: 1000,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'followers_reached', count: 100 },
    },
    {
      name: '500 Follower',
      description: '500 Follower. Du bist ein Star auf SportRise.',
      iconName: 'Trophy',
      rarity: BadgeRarity.LEGENDARY,
      xpReward: 5000,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'followers_reached', count: 500 },
    },
    {
      name: 'Guter Ratgeber',
      description: '100 Kommentare verfasst – du teilst dein Wissen und hilfst anderen.',
      iconName: 'MessageSquare',
      rarity: BadgeRarity.RARE,
      xpReward: 250,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'comments_written', count: 100 },
    },
    {
      name: 'Tagebuch-Schreiber',
      description: '10 Tagebucheinträge – du hältst deinen Weg fest.',
      iconName: 'BookOpen',
      rarity: BadgeRarity.COMMON,
      xpReward: 100,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'diary_entries', count: 10 },
    },
  ]

  // ── Sport (5) ────────────────────────────────────────────────

  const sportBadges: BadgeDef[] = [
    {
      name: 'Vereinsmitglied',
      description: 'Du bist einem Verein beigetreten. Sport im Verein ist der beste Sport.',
      iconName: 'Building2',
      rarity: BadgeRarity.COMMON,
      xpReward: 150,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'verein_joined' },
    },
    {
      name: 'Turnier-Rookie',
      description: 'Du hast dich für dein erstes Turnier angemeldet. Auf gehts.',
      iconName: 'Medal',
      rarity: BadgeRarity.COMMON,
      xpReward: 200,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'tournament_entered', count: 1 },
    },
    {
      name: 'Turnier-Veteran',
      description: '5 Turnier-Anmeldungen – du liebst den Wettkampf.',
      iconName: 'Award',
      rarity: BadgeRarity.RARE,
      xpReward: 500,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'tournament_entered', count: 5 },
    },
    {
      name: 'Vereinsgründer',
      description: 'Dein Verein wurde auf SportRise verifiziert. Du hast etwas aufgebaut.',
      iconName: 'Landmark',
      rarity: BadgeRarity.EPIC,
      xpReward: 2000,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'verein_submitted_and_verified' },
    },
    {
      name: 'Sparrings-Partner',
      description: 'Du hast eine Sparrings-Anfrage angenommen. Gemeinsam wächst man schneller.',
      iconName: 'Swords',
      rarity: BadgeRarity.COMMON,
      xpReward: 100,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'sparring_accepted', count: 1 },
    },
  ]

  // ── Meilenstein (3) ──────────────────────────────────────────

  const milestoneBadges: BadgeDef[] = [
    {
      name: 'Level 5',
      description: 'Du hast Level 5 erreicht. Der Fortschritt ist spürbar.',
      iconName: 'Zap',
      rarity: BadgeRarity.RARE,
      xpReward: 250,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'level_reached', level: 5 },
    },
    {
      name: 'Level 10',
      description: 'Level 10 erreicht – du bist kein Anfänger mehr.',
      iconName: 'Zap',
      rarity: BadgeRarity.EPIC,
      xpReward: 1000,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'level_reached', level: 10 },
    },
    {
      name: 'Level 25',
      description: 'Level 25 – das Maximum. SportRise kennt niemanden, der weiter gegangen ist.',
      iconName: 'Crown',
      rarity: BadgeRarity.LEGENDARY,
      xpReward: 5000,
      isSecret: false,
      sportSlug: null,
      requirement: { type: 'level_reached', level: 25 },
    },
  ]

  // ── Easter Eggs (6, isSecret: true) ─────────────────────────

  const easterEggBadges: BadgeDef[] = [
    {
      name: '3:33 Uhr',
      description: 'Du hast dreimal um 03:33 Uhr trainiert. Wir haben keine Fragen.',
      iconName: 'Clock',
      rarity: BadgeRarity.LEGENDARY,
      xpReward: 999,
      isSecret: true,
      sportSlug: null,
      requirement: { type: 'training_at_time', hour: 3, minuteMin: 31, minuteMax: 35, count: 3 },
    },
    {
      name: 'Mitternachts-Snack',
      description: 'Du hast um Mitternacht eine Mahlzeit eingetragen. Keine Wertung.',
      iconName: 'Moon',
      rarity: BadgeRarity.RARE,
      xpReward: 150,
      isSecret: true,
      sportSlug: null,
      requirement: { type: 'meal_at_midnight', hour: 0 },
    },
    {
      name: 'Hartnäckig',
      description: 'Du hast 10-mal auf das Logo geklickt. Wir sehen alles.',
      iconName: 'MousePointerClick',
      rarity: BadgeRarity.COMMON,
      xpReward: 25,
      isSecret: true,
      sportSlug: null,
      requirement: { type: 'logo_clicks', count: 10 },
    },
    {
      name: 'Stiller Leser',
      description: 'Du hast alle FAQ-Einträge geöffnet. Wissensdurst ist eine Tugend.',
      iconName: 'BookOpen',
      rarity: BadgeRarity.RARE,
      xpReward: 200,
      isSecret: true,
      sportSlug: null,
      requirement: { type: 'all_faq_opened' },
    },
    {
      name: 'Erste Wahl',
      description: 'Du gehörst zu den allerersten SportRise-Sportlern in Hessen.',
      iconName: 'CircleDot',
      rarity: BadgeRarity.COMMON,
      xpReward: 10,
      isSecret: true,
      sportSlug: null,
      requirement: { type: 'first_registration' },
    },
    {
      name: 'Perfekte Woche',
      description: '3 perfekte Wochen in Folge – Training, Ernährung und Erholung stimmen.',
      iconName: 'Star',
      rarity: BadgeRarity.EPIC,
      xpReward: 333,
      isSecret: true,
      sportSlug: null,
      requirement: { type: 'perfect_week', count: 3 },
    },
  ]

  // ── Cleanup: Badges entfernen, die nicht mehr in der Spec sind ─

  const allBadges: BadgeDef[] = [
    ...trainingBadges,
    ...streakBadges,
    ...recoveryBadges,
    ...nutritionBadges,
    ...socialBadges,
    ...sportBadges,
    ...milestoneBadges,
    ...easterEggBadges,
  ]

  const validBadgeNames = allBadges.map((b) => b.name)
  const deleted = await prisma.badge.deleteMany({
    where: { name: { notIn: validBadgeNames }, userBadges: { none: {} } },
  })
  if (deleted.count > 0) {
    console.log(`${deleted.count} veraltete Badges entfernt.`)
  }

  // ── Upsert aller Badges ──────────────────────────────────────

  for (const badgeDef of allBadges) {
    const sportId = badgeDef.sportSlug !== null ? (sportMap.get(badgeDef.sportSlug) ?? null) : null

    await prisma.badge.upsert({
      where: { name: badgeDef.name },
      update: {
        description: badgeDef.description,
        iconName: badgeDef.iconName,
        rarity: badgeDef.rarity,
        xpReward: badgeDef.xpReward,
        isSecret: badgeDef.isSecret,
        requirement: badgeDef.requirement,
        sportId,
      },
      create: {
        name: badgeDef.name,
        description: badgeDef.description,
        iconName: badgeDef.iconName,
        rarity: badgeDef.rarity,
        xpReward: badgeDef.xpReward,
        isSecret: badgeDef.isSecret,
        requirement: badgeDef.requirement,
        sportId,
      },
    })
  }

  console.log(`${trainingBadges.length} Training-Badges erstellt/aktualisiert.`)
  console.log(`${streakBadges.length} Streak-Badges erstellt/aktualisiert.`)
  console.log(`${recoveryBadges.length} Recovery-Badges erstellt/aktualisiert.`)
  console.log(`${nutritionBadges.length} Ernährungs-Badges erstellt/aktualisiert.`)
  console.log(`${socialBadges.length} Sozial-Badges erstellt/aktualisiert.`)
  console.log(`${sportBadges.length} Sport-Badges erstellt/aktualisiert.`)
  console.log(`${milestoneBadges.length} Meilenstein-Badges erstellt/aktualisiert.`)
  console.log(`${easterEggBadges.length} Easter-Egg-Badges erstellt/aktualisiert.`)
  console.log(`Gesamt: ${allBadges.length} Badges.`)
  console.log('Seed erfolgreich abgeschlossen.')
}

main()
  .catch((error: unknown) => {
    console.error('Seed fehlgeschlagen:', error)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
