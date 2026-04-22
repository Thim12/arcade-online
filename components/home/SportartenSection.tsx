'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface SportCount {
  slug: string
  vereinCount: number
  tournamentCount: number
}

interface SportartenSectionProps {
  sportCounts: SportCount[]
}

interface SportMeta {
  slug: string
  name: string
  color: string
  gradient: string
  image: string
}

const SPORT_METAS: SportMeta[] = [
  {
    slug: 'fussball',
    name: 'Fussball',
    color: '#16A34A',
    gradient: 'from-green-500 to-emerald-600',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&q=75',
  },
  {
    slug: 'tennis',
    name: 'Tennis',
    color: '#C2621A',
    gradient: 'from-amber-500 to-orange-600',
    image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=600&q=75',
  },
  {
    slug: 'basketball',
    name: 'Basketball',
    color: '#EA580C',
    gradient: 'from-orange-500 to-red-500',
    image: 'https://images.unsplash.com/photo-1559692048-79a3f837883d?w=600&q=75',
  },
]

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const cardVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: 'easeOut' },
  },
}

export default function SportartenSection({ sportCounts }: SportartenSectionProps) {
  const getCount = (slug: string): { vereinCount: number; tournamentCount: number } =>
    sportCounts.find((s) => s.slug === slug) ?? { vereinCount: 0, tournamentCount: 0 }

  return (
    <section className="bg-white py-28 sm:py-32">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
        <motion.div
          className="text-center mb-16"
          initial={false}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-200 mb-4">
            Sportarten
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-zinc-900 tracking-tight">
            Dein Sport. Deine Platform.
          </h2>
          <p className="mt-4 text-zinc-500 text-lg max-w-xl mx-auto">
            Jetzt in Hessen — bald in ganz Deutschland.
          </p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial={false}
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
        >
          {SPORT_METAS.map((sport) => {
            const counts = getCount(sport.slug)

            return (
              <motion.div
                key={sport.slug}
                variants={cardVariants}
                data-sport={sport.slug}
                className="group relative bg-white rounded-2xl overflow-hidden border border-zinc-200/80 shadow-sm transition-all duration-300 hover:shadow-xl hover:shadow-zinc-200/50 hover:-translate-y-1 hover:border-zinc-300"
              >
                {/* Image */}
                <div className="relative h-44 overflow-hidden">
                  <img
                    src={sport.image}
                    alt={sport.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                  <div className="absolute bottom-4 left-5">
                    <h3 className="text-xl font-bold text-white drop-shadow-sm">{sport.name}</h3>
                  </div>
                  <div
                    className="absolute top-3 right-3 h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-sm"
                    style={{ backgroundColor: sport.color }}
                    aria-hidden="true"
                  />
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="space-y-2 mb-5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sport.color }} />
                      <p className="text-zinc-600 text-sm font-medium">
                        {counts.vereinCount} {counts.vereinCount === 1 ? 'Verein' : 'Vereine'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sport.color }} />
                      <p className="text-zinc-600 text-sm font-medium">
                        {counts.tournamentCount} {counts.tournamentCount === 1 ? 'Turnier' : 'Turniere'}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/vereine?sport=${sport.slug}`}
                    className="inline-flex items-center gap-2 text-sm font-semibold rounded-lg px-4 py-2.5 transition-all duration-200 group-hover:shadow-md"
                    style={{ color: sport.color, backgroundColor: `${sport.color}0D` }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = `${sport.color}1A`
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = `${sport.color}0D`
                    }}
                  >
                    Entdecken
                    <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}