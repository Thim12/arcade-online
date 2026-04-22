'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useSpring, useTransform, useMotionValue as motionValue } from 'framer-motion'
import * as Dialog from '@radix-ui/react-dialog'
import * as Slider from '@radix-ui/react-slider'
import { X, Check, Activity, Scan, AlertTriangle, Save, Loader2, Info } from 'lucide-react'
import { useNutritionScanner } from '@/hooks/useNutritionScanner'
import type { MealType } from '@/app/dashboard/ernaehrung/ErnaehrungClient'

// Rolling Number Component using Framer Motion Springs
function RollingNumber({ value }: { value: number }) {
  const animatedValue = motionValue(value)
  const springValue = useSpring(animatedValue, { stiffness: 120, damping: 20 })
  const display = useTransform(springValue, (current) => 
    Number.isInteger(value) ? Math.round(current).toString() : Number(Math.round(current * 10) / 10).toFixed(1)
  )

  useEffect(() => {
    animatedValue.set(value)
  }, [animatedValue, value])

  return <motion.span>{display}</motion.span>
}

interface ErnaehrungScannerOverlayProps {
  onAddFood: (food: any, portionGrams: number, mealType: MealType) => Promise<void>
}

export function ErnaehrungScannerOverlay({ onAddFood }: ErnaehrungScannerOverlayProps) {
  const scanner = useNutritionScanner()
  const { state, startVisualScan, stopScan, videoRef, saveAsCustomProduct, isAdmin } = scanner

  const [portionGrams, setPortionGrams] = useState(100)
  const [activeMealType, setActiveMealType] = useState<MealType>('SNACK')
  const [isAdding, setIsAdding] = useState(false)

  // Admin form state
  const [adminForm, setAdminForm] = useState({
    name: '',
    category: 'snack',
    calories: 100,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
  })
  const [adminSaving, setAdminSaving] = useState(false)
  const [adminSuccess, setAdminSuccess] = useState(false)

  const isScanning = state.mode === 'visual'

  // Reset portion when a new product is found
  useEffect(() => {
    if (state.status === 'found' && state.product) {
      setPortionGrams(100)
    }
  }, [state.status, state.product])

  // Cleanup on unmount handled by hook, but ensure we close
  useEffect(() => {
    return () => {
      stopScan()
    }
  }, [stopScan])

  const handleAdd = async () => {
    if (!state.product) return
    setIsAdding(true)
    
    const mappedFood = {
      id: `scanned_${Date.now()}`,
      name: state.product.name,
      brand: state.product.source === 'open_food_facts' ? 'Scanned' : 'Custom AI',
      category: state.product.category || 'other',
      per100g: {
        calories: state.product.calories,
        proteinG: state.product.proteinG || 0,
        carbsG: state.product.carbsG || 0,
        fatG: state.product.fatG || 0,
        fiberG: state.product.fiberG || 0,
      },
      defaultPortionGrams: 100,
      portionOptions: [50, 100, 150, 200, 250],
    }

    await onAddFood(mappedFood, portionGrams, activeMealType)
    setIsAdding(false)
    stopScan()
  }

  const handleAdminSave = async () => {
    setAdminSaving(true)
    const res = await saveAsCustomProduct(adminForm)
    setAdminSaving(false)
    if (res.success) {
      setAdminSuccess(true)
      setTimeout(() => {
        stopScan()
        setAdminSuccess(false)
      }, 2000)
    } else {
      alert(res.error)
    }
  }

  // Calculate scaled macros
  const p = state.product
  const macros = p ? {
    calories: Math.round((p.calories * portionGrams) / 100),
    protein: Math.round((p.proteinG * portionGrams) / 100 * 10) / 10,
    carbs: Math.round((p.carbsG * portionGrams) / 100 * 10) / 10,
    fat: Math.round((p.fatG * portionGrams) / 100 * 10) / 10,
  } : null

  return (
    <>
      <button
        onClick={() => {
          if (window.confirm("Möchtest du SportRise den Zugriff auf deine Kamera erlauben, um Lebensmittel zu scannen?\nAlle Daten werden nur lokal verarbeitet!")) {
            void startVisualScan()
          }
        }}
        className="w-full relative overflow-hidden flex items-center justify-between p-5 mt-4 mb-2 rounded-3xl bg-zinc-900 shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent" />
        <div className="relative z-10 flex flex-col items-start gap-1">
          <div className="flex items-center gap-2">
            <Scan size={20} className="text-green-400" />
            <h3 className="text-white font-bold text-lg">Foto-Scan (KI)</h3>
          </div>
          <p className="text-zinc-400 text-xs">Visuelle Objekt- und Nährwerterkennung</p>
        </div>
        <div className="relative z-10 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
          <Activity size={18} className="text-white" />
        </div>
      </button>

      <AnimatePresence>
        {isScanning && (
          <Dialog.Root open={isScanning} onOpenChange={(v) => { if (!v) stopScan() }}>
            <Dialog.Portal>
              <Dialog.Overlay 
                className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 transition-opacity" 
              />
              <Dialog.Content className="fixed inset-0 z-50 flex flex-col outline-none">
                
                {/* Header Actions */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-20">
                  <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                    <span className="text-[10px] text-white/70 uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Live Feed
                    </span>
                  </div>
                  <button 
                    onClick={stopScan}
                    className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md border border-white/10 flex items-center justify-center text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Main Camera View */}
                <div className="flex-1 flex flex-col justify-center items-center p-6 relative">
                  
                  {/* Camera Output */}
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="relative w-full max-w-sm aspect-[3/4] bg-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
                  >
                    <video
                      ref={videoRef as React.Ref<HTMLVideoElement>}
                      className="absolute inset-0 w-full h-full object-cover"
                      playsInline
                      muted
                      autoPlay
                    />
                    
                    {/* Bounding Box SVG Overlay */}
                    <div className="absolute inset-0 z-10 pointer-events-none p-8 flex items-center justify-center">
                      <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" preserveAspectRatio="none">
                        <motion.rect
                          x="10" y="20" width="80" height="60" rx="4"
                          stroke="rgba(74, 222, 128, 0.8)"
                          strokeWidth="1.5"
                          strokeDasharray="4 4"
                          initial={{ pathLength: 0, opacity: 0 }}
                          animate={{ 
                            pathLength: 1, 
                            opacity: (state.status === 'scanning' || state.status === 'loading_model') ? 0.7 : 0 
                          }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        {/* Corner markers */}
                        <path d="M 10 30 L 10 20 L 20 20" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 80 20 L 90 20 L 90 30" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 90 70 L 90 80 L 80 80" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M 20 80 L 10 80 L 10 70" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>

                    {/* Status Pill Badge */}
                    <AnimatePresence>
                      {(state.status === 'loading_model' || state.status === 'scanning' || state.status === 'processing') && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 20 }}
                          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20"
                        >
                          <div className="flex items-center gap-2 bg-black/70 backdrop-blur-lg px-4 py-2 rounded-full border border-white/20 shadow-xl">
                            <Loader2 size={14} className="text-green-400 animate-spin" />
                            <span className="text-xs font-medium text-white">
                              {state.status === 'loading_model' ? 'AI Modell lädt...' : 
                               state.status === 'processing' ? 'SportRise AI: Abgleich mit Datenbank...' :
                               'Analysiere Objekt...'}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>

                  {/* DSGVO Info Text */}
                  <div className="mt-8 opacity-50 px-8 text-center">
                    <p className="text-[10px] text-white flex items-center justify-center gap-1.5">
                      <Activity size={10} />
                      Alle Bilddaten werden in Echtzeit lokal verarbeitet. Es erfolgt keine Speicherung deiner Fotos auf unseren Servern.
                    </p>
                  </div>
                </div>

                {/* Review Panel (Bottom Sheet) */}
                <AnimatePresence>
                  {state.status === 'found' && p && macros && (
                    <motion.div
                      initial={{ y: '100%', opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: '100%', opacity: 0 }}
                      transition={{ type: "spring", damping: 25, stiffness: 250 }}
                      className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] border-t border-zinc-200 z-30"
                    >
                      <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-5" />
                      
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 bg-green-100 text-green-700">
                            <Check size={10} />
                            KI Match ({Math.round((p.similarity || 0.95) * 100)}%)
                          </div>
                          <h2 className="text-2xl font-bold text-zinc-900">{p.name}</h2>
                          <p className="text-zinc-500 text-sm mt-0.5 capitalize">{p.category}</p>
                        </div>
                      </div>

                      {/* Slider Portion */}
                      <div className="mb-6">
                        <div className="flex justify-between items-end mb-3">
                          <label className="text-sm font-semibold text-zinc-700">Menge anpassen</label>
                          <span className="text-xl font-bold text-green-600 tabular-nums">{portionGrams}g</span>
                        </div>
                        
                        <Slider.Root 
                          className="relative flex items-center select-none touch-none w-full h-5"
                          value={[portionGrams]}
                          max={500}
                          min={10}
                          step={10}
                          onValueChange={(val) => setPortionGrams(val[0])}
                        >
                          <Slider.Track className="bg-zinc-200 relative grow rounded-full h-2">
                            <Slider.Range className="absolute bg-green-500 rounded-full h-full" />
                          </Slider.Track>
                          <Slider.Thumb 
                            className="block w-6 h-6 bg-white shadow-md border border-zinc-200 rounded-full hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2" 
                            aria-label="Portion size"
                          />
                        </Slider.Root>
                        
                        <div className="flex justify-between text-xs text-zinc-400 mt-2 font-medium">
                          <span>10g</span>
                          <span>250g</span>
                          <span>500g</span>
                        </div>
                      </div>

                      {/* Live Macros */}
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-zinc-50 border border-zinc-100 p-4 rounded-2xl flex flex-col items-center justify-center">
                          <span className="text-zinc-500 text-xs font-semibold uppercase tracking-wider mb-1">Kalorien</span>
                          <span className="text-3xl font-black text-zinc-900 flex items-baseline gap-1">
                            <RollingNumber value={macros.calories} />
                            <span className="text-sm font-medium text-zinc-400">kcal</span>
                          </span>
                        </div>
                        <div className="bg-green-50 border border-green-100 p-4 rounded-2xl flex flex-col items-center justify-center">
                          <span className="text-green-600/70 text-xs font-semibold uppercase tracking-wider mb-1">Protein</span>
                          <span className="text-3xl font-black text-green-600 flex items-baseline gap-1">
                            <RollingNumber value={macros.protein} />
                            <span className="text-sm font-medium text-green-600/70">g</span>
                          </span>
                        </div>
                      </div>

                      {/* Sport Context */}
                      <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3 flex items-start gap-2 mb-6">
                        <Activity size={16} className="text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <p className="text-sm text-blue-900 font-medium select-none">
                            Deckt ca. {Math.min(100, Math.round((macros.protein / 50) * 100))}% deines Proteinbedarfs für Fußball
                          </p>
                          <p className="text-[10px] text-blue-600/60 mt-1 uppercase tracking-wider font-semibold">
                            Disclaimer: KI-Schätzung: Bitte prüfe die Mengen vor der Bestätigung.
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => void handleAdd()}
                        disabled={isAdding}
                        className="w-full py-4 rounded-2xl bg-zinc-900 text-white font-bold text-lg flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors shadow-lg active:scale-[0.99]"
                      >
                        {isAdding ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                        Als Mahlzeit protokollieren
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Admin Training Panel for Not Found */}
                <AnimatePresence>
                  {state.status === 'not_found' && (
                    <motion.div
                      initial={{ y: '100%', opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: '100%', opacity: 0 }}
                      transition={{ type: "spring", damping: 25 }}
                      className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-2xl border-t border-zinc-200 z-30"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="text-amber-500" size={24} />
                        <h2 className="text-xl font-bold text-zinc-900">Produkt nicht erkannt</h2>
                      </div>
                      <p className="text-sm text-zinc-500 mb-6">
                        Die KI konnte dieses Produkt nicht identifizieren.
                      </p>

                      {isAdmin ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                            <h3 className="text-sm font-bold text-amber-900 flex items-center gap-2 mb-3">
                              <Save size={16} /> Admin-Modus (Familie)
                            </h3>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <input 
                                type="text" placeholder="Name" 
                                className="col-span-2 w-full p-2.5 rounded-lg border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                value={adminForm.name}
                                onChange={(e) => setAdminForm({...adminForm, name: e.target.value})}
                              />
                              <input 
                                type="number" placeholder="Kcal" 
                                className="w-full p-2.5 rounded-lg border border-amber-200 text-sm"
                                value={adminForm.calories || ''}
                                onChange={(e) => setAdminForm({...adminForm, calories: Number(e.target.value)})}
                              />
                              <input 
                                type="number" placeholder="Protein (g)" 
                                className="w-full p-2.5 rounded-lg border border-amber-200 text-sm"
                                value={adminForm.proteinG || ''}
                                onChange={(e) => setAdminForm({...adminForm, proteinG: Number(e.target.value)})}
                              />
                            </div>
                            <button
                              onClick={() => void handleAdminSave()}
                              disabled={adminSaving || !adminForm.name}
                              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold transition-colors disabled:opacity-50"
                            >
                              {adminSaving ? <Loader2 size={16} className="animate-spin mx-auto" /> : 
                               adminSuccess ? <Check size={16} className="mx-auto" /> :
                               'Dieses Bild als neues Produkt speichern'}
                            </button>
                            <p className="text-[10px] text-amber-700/60 mt-2 text-center">
                              Speichert das Objekt-Embedding in der Vector-DB zur zukünftigen Erkennung.
                            </p>
                          </div>
                          
                          <button onClick={stopScan} className="w-full py-3 rounded-xl border border-zinc-200 text-zinc-600 font-semibold">
                            Abbrechen
                          </button>
                        </div>
                      ) : (
                        <button onClick={stopScan} className="w-full py-4 rounded-xl bg-zinc-900 text-white font-bold">
                          Zurück zum Dashboard
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
      </AnimatePresence>
    </>
  )
}
