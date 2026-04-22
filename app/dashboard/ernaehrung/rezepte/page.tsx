'use client'
import { Utensils, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function RezeptePage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col p-6 sm:p-8 relative">
      <Link href="/dashboard/ernaehrung" className="absolute top-6 left-6 p-2 bg-white rounded-full shadow-sm">
        <ArrowLeft className="w-5 h-5 text-zinc-600" />
      </Link>
      <div className="max-w-md w-full mx-auto mt-16 text-center">
        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-3xl mx-auto flex items-center justify-center mb-6">
          <Utensils className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Gespeicherte Rezepte</h1>
        <p className="text-zinc-500 mb-8">Deine persoenliche Rezept-Bibliothek aus dem Smart Scanner.</p>
        <div className="flex flex-col gap-4 opacity-50">
          <div className="bg-white rounded-2xl h-24 w-full" />
          <div className="bg-white rounded-2xl h-24 w-full" />
        </div>
      </div>
    </div>
  )
}
