'use client'

// ─────────────────────────────────────────────────────────────────
// FridgeClient – Smart Kühlschrank Manager UI
//
// Features:
//  • Grid-Ansicht aller Inventar-Items
//  • Ablaufdatum-Warnings (rot/gelb/grün)
//  • Kategorie-Filter
//  • Scanner-Integration (SmartVisionScanner)
//  • Barcode-Hinzufügen via OpenFoodFacts
// ─────────────────────────────────────────────────────────────────

import { useState, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ChevronLeft,
  Package,
  Plus,
  Trash2,
  ScanLine,
  AlertTriangle,
  Clock,
  Search,
  X,
  Loader2,
  Sparkles,
  Camera,
  Barcode,
  Filter,
} from 'lucide-react'
import { KuehlschrankScannerOverlay } from '@/app/dashboard/ernaehrung/KuehlschrankScannerOverlay'

// ── Typen ─────────────────────────────────────────────────────────

interface InventoryItem {
  id: string
  name: string
  category: string | null
  quantity: number
  quantityG: number
  unit: string
  barcode: string | null
  expiryDate: string | null
  caloriesPer100: number | null
  proteinGPer100: number | null
  carbsGPer100: number | null
  fatGPer100: number | null
  addedVia: string
  createdAt: string
}

interface FridgeClientProps {
  initialItems: InventoryItem[]
}

// ── Kategorie-Labels ──────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  OBST: 'Obst',
  GEMUESE: 'Gemüse',
  MILCHPRODUKTE: 'Milchprodukte',
  FLEISCH: 'Fleisch & Fisch',
  GETRAENKE: 'Getränke',
  FERTIGPRODUKTE: 'Fertigprodukte',
  LIVE_SCAN: 'Gescannt',
  BATCH_SCAN: 'Gescannt',
  SONSTIGES: 'Sonstiges',
}

const CATEGORY_COLORS: Record<string, string> = {
  OBST: '#16A34A',
  GEMUESE: '#22C55E',
  MILCHPRODUKTE: '#3B82F6',
  FLEISCH: '#EF4444',
  GETRAENKE: '#06B6D4',
  FERTIGPRODUKTE: '#F59E0B',
  LIVE_SCAN: '#8B5CF6',
  BATCH_SCAN: '#8B5CF6',
  SONSTIGES: '#71717A',
}

// ── Ablauf-Helfer ─────────────────────────────────────────────────

function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) return null
  const now = new Date()
  const exp = new Date(expiryDate)
  return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

function getExpiryBadge(days: number | null): { label: string; color: string; bg: string } {
  if (days === null) return { label: 'Kein Datum', color: '#71717A', bg: '#F4F4F5' }
  if (days < 0) return { label: 'Abgelaufen', color: '#DC2626', bg: '#FEF2F2' }
  if (days <= 2) return { label: `${days}d übrig`, color: '#DC2626', bg: '#FEF2F2' }
  if (days <= 5) return { label: `${days}d übrig`, color: '#F59E0B', bg: '#FFFBEB' }
  return { label: `${days}d übrig`, color: '#16A34A', bg: '#F0FDF4' }
}

// ── Hauptkomponente ───────────────────────────────────────────────

export function FridgeClient({ initialItems }: FridgeClientProps) {
  const [items, setItems] = useState(initialItems)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [showScanner, setShowScanner] = useState(false)
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()

  // ── Kategorien ──────────────────────────────────────────────
  const categories = useMemo(() => {
    const cats = new Set<string>()
    items.forEach((i) => cats.add(i.category ?? 'SONSTIGES'))
    return Array.from(cats).sort()
  }, [items])

  // ── Gefilterte Items ────────────────────────────────────────
  const filteredItems = useMemo(() => {
    let result = items

    if (activeCategory) {
      result = result.filter((i) => (i.category ?? 'SONSTIGES') === activeCategory)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((i) => i.name.toLowerCase().includes(q))
    }

    return result
  }, [items, activeCategory, searchQuery])

  // ── Delete Handler ──────────────────────────────────────────
  const handleDelete = useCallback(async (id: string) => {
    setIsDeleting(id)
    try {
      const res = await fetch(`/api/ernaehrung/inventory/batch`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id }),
      })
      if (res.ok) {
        setItems((prev) => prev.filter((i) => i.id !== id))
      }
    } finally {
      setIsDeleting(null)
    }
  }, [])

  // ── Scanner Callback ────────────────────────────────────────
  const handleScannerConfirm = useCallback(async (detectedItems: { name: string; confidence: number }[]) => {
    const res = await fetch('/api/vision', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: detectedItems }),
    })

    if (!res.ok) throw new Error('Speichern fehlgeschlagen')

    setShowScanner(false)
    router.refresh()

    // Reload items
    const refreshRes = await fetch('/api/ernaehrung/inventory/batch')
    if (refreshRes.ok) {
      // Server component will re-render
    }
    window.location.reload()
  }, [router])

  const totalItems = items.length
  const expiringCount = items.filter((i) => {
    const days = getDaysUntilExpiry(i.expiryDate)
    return days !== null && days <= 3
  }).length

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Breadcrumb */}
      <div className="px-4 pt-4">
        <Link
          href="/dashboard/ernaehrung"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-700 transition-colors"
        >
          <ChevronLeft size={14} />
          Ernährung
        </Link>
        <span className="text-zinc-300 mx-1.5">/</span>
        <span className="text-sm font-semibold text-zinc-900">Smart Kühlschrank</span>
      </div>

      {/* Header */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shadow-sm">
              <Package size={20} className="text-emerald-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">Mein Kühlschrank</h1>
              <p className="text-sm text-zinc-500">
                {totalItems} Artikel{expiringCount > 0 && ` · ${expiringCount} laufen bald ab`}
              </p>
            </div>
          </div>
        </div>

        {/* Expiry Warning */}
        {expiringCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700"
          >
            <AlertTriangle size={16} className="shrink-0" />
            <span>
              <strong>{expiringCount}</strong> Lebensmittel laufen in den nächsten 3 Tagen ab.
            </span>
          </motion.div>
        )}
      </div>

      <div className="px-4 mt-4 pb-32 space-y-4">
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowScanner(true)}
            className="flex items-center justify-center gap-2 py-3.5 bg-zinc-900 text-white rounded-2xl font-semibold text-sm shadow-lg hover:bg-zinc-800 transition-all"
          >
            <Camera size={18} />
            KI Scanner
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => {
              // TODO: Barcode sheet öffnen
            }}
            className="flex items-center justify-center gap-2 py-3.5 bg-white text-zinc-900 border border-zinc-200 rounded-2xl font-semibold text-sm shadow-sm hover:bg-zinc-50 transition-all"
          >
            <Barcode size={18} />
            Barcode Scan
          </motion.button>
        </div>

        {/* Search + Filter */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Suchen..."
              className="w-full pl-9 pr-3 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-green-600/30 transition-all"
            />
          </div>
          {activeCategory && (
            <button
              onClick={() => setActiveCategory(null)}
              className="flex items-center gap-1 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-700 font-medium"
            >
              <X size={12} />
              Filter
            </button>
          )}
        </div>

        {/* Category Chips */}
        {categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            {categories.map((cat) => {
              const isActive = activeCategory === cat
              const color = CATEGORY_COLORS[cat] ?? '#71717A'
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(isActive ? null : cat)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${
                    isActive
                      ? 'text-white shadow-sm'
                      : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50'
                  }`}
                  style={
                    isActive
                      ? { backgroundColor: color, borderColor: color }
                      : undefined
                  }
                >
                  <Filter size={10} />
                  {CATEGORY_LABELS[cat] ?? cat}
                  <span className={`text-[10px] ${isActive ? 'text-white/70' : 'text-zinc-400'}`}>
                    {items.filter((i) => (i.category ?? 'SONSTIGES') === cat).length}
                  </span>
                </button>
              )
            })}
          </div>
        )}

        {/* Inventory Grid */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {filteredItems.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <Package size={40} className="mx-auto text-zinc-300 mb-3" />
                <p className="text-sm text-zinc-400 font-medium">
                  {searchQuery ? 'Keine Treffer' : 'Dein Kühlschrank ist leer.'}
                </p>
                <p className="text-xs text-zinc-400 mt-1">
                  Nutze den KI Scanner, um Lebensmittel hinzuzufügen.
                </p>
              </motion.div>
            ) : (
              filteredItems.map((item, index) => {
                const days = getDaysUntilExpiry(item.expiryDate)
                const badge = getExpiryBadge(days)
                const catColor = CATEGORY_COLORS[item.category ?? 'SONSTIGES'] ?? '#71717A'

                return (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ delay: index * 0.03 }}
                    className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {/* Category Dot */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                          style={{ backgroundColor: `${catColor}12` }}
                        >
                          <Package size={18} style={{ color: catColor }} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-zinc-900 text-sm truncate capitalize">
                            {item.name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-zinc-400">
                              {item.quantity}× · {item.quantityG}g
                            </span>
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ color: badge.color, backgroundColor: badge.bg }}
                            >
                              {badge.label}
                            </span>
                            {item.addedVia === 'BATCH_SCAN' && (
                              <span className="text-[10px] text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded-full font-medium flex items-center gap-0.5">
                                <Sparkles size={8} />
                                KI
                              </span>
                            )}
                          </div>

                          {/* Macros */}
                          {item.caloriesPer100 != null && (
                            <div className="flex gap-2 mt-1.5 text-[10px] text-zinc-400">
                              <span>{item.caloriesPer100} kcal</span>
                              {item.proteinGPer100 != null && <span>P {item.proteinGPer100}g</span>}
                              {item.carbsGPer100 != null && <span>K {item.carbsGPer100}g</span>}
                              {item.fatGPer100 != null && <span>F {item.fatGPer100}g</span>}
                              <span className="text-zinc-300">pro 100g</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Delete */}
                      <button
                        onClick={() => void handleDelete(item.id)}
                        disabled={isDeleting === item.id}
                        className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all shrink-0"
                      >
                        {isDeleting === item.id ? (
                          <Loader2 size={16} className="animate-spin" />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                    </div>
                  </motion.div>
                )
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Scanner Overlay – gleiche UI wie in Ernährung */}
      <AnimatePresence>
        {showScanner && (
          <KuehlschrankScannerOverlay onClose={() => { setShowScanner(false); router.refresh() }} />
        )}
      </AnimatePresence>
    </div>
  )
}
