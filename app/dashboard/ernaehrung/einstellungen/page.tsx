'use client'
import { Settings, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function EinstellungenPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col p-6 sm:p-8 relative">
      <Link href="/dashboard/ernaehrung" className="absolute top-6 left-6 p-2 bg-white rounded-full shadow-sm">
        <ArrowLeft className="w-5 h-5 text-zinc-600" />
      </Link>
      <div className="max-w-md w-full mx-auto mt-16 text-center">
        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-3xl mx-auto flex items-center justify-center mb-6">
          <Settings className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Einstellungen</h1>
        <p className="text-zinc-500 mb-8">Passe deine Kalorien- und Makroziele manuell an.</p>
        <div className="bg-white rounded-3xl p-6 text-left opacity-60 pointer-events-none">
          <div className="mb-4">
            <label className="block text-sm font-bold text-zinc-500 mb-2">Taegliches Kalorienziel</label>
            <div className="h-12 bg-zinc-100 rounded-xl w-full" />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-bold text-zinc-500 mb-2">Makro Split (Carbs / Protein / Fat)</label>
            <div className="h-12 bg-zinc-100 rounded-xl w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
