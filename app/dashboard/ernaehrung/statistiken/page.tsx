'use client'
import { BarChart2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function StatistikenPage() {
  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col p-6 sm:p-8 relative">
      <Link href="/dashboard/ernaehrung" className="absolute top-6 left-6 p-2 bg-white rounded-full shadow-sm">
        <ArrowLeft className="w-5 h-5 text-zinc-600" />
      </Link>
      <div className="max-w-md w-full mx-auto mt-16 text-center">
        <div className="w-20 h-20 bg-green-50 text-green-600 rounded-3xl mx-auto flex items-center justify-center mb-6">
          <BarChart2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Statistiken</h1>
        <p className="text-zinc-500 mb-8">Deine Langzeitanalyse wird hier bald mit Graphen und Trends verfuegbar sein.</p>
        <div className="bg-white rounded-[2.5rem] p-8 border border-zinc-100 shadow-sm opacity-50">
          <div className="h-40 border-b border-l border-zinc-200 flex items-end justify-between px-2 pb-2">
            <div className="w-6 bg-zinc-200 h-[30%] rounded-t-sm" />
            <div className="w-6 bg-zinc-200 h-[60%] rounded-t-sm" />
            <div className="w-6 bg-zinc-200 h-[40%] rounded-t-sm" />
            <div className="w-6 bg-zinc-200 h-[80%] rounded-t-sm" />
            <div className="w-6 bg-zinc-200 h-[100%] rounded-t-sm" />
          </div>
        </div>
      </div>
    </div>
  )
}
