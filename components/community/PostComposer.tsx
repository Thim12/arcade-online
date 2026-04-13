'use client'

// ─────────────────────────────────────────────────────────────────
// PostComposer.tsx – Neuen Post erstellen
// Avatar + Auto-Resize-Textarea, Zeichenzähler, Media-Upload,
// Sport-Tag-Dropdown, Post-Typ-Dropdown, Optimistic Update
// ─────────────────────────────────────────────────────────────────

import { useRef, useState, useCallback, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Image as ImageIcon,
  ChevronDown,
  X,
  Loader2,
  Send,
} from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase'
import type { FeedPost } from './Feed'

// ── Typen ────────────────────────────────────────────────────────

interface Sport {
  id: string
  name: string
  slug: string
  colorPrimary: string
}

interface CurrentUser {
  id: string
  name: string | null
  username: string | null
  image: string | null
  level: number
  sports: Sport[]
}

interface PostComposerProps {
  currentUser: CurrentUser
  sports: Sport[]
  onPostCreated: (post: FeedPost) => void
  onError: (message: string) => void
}

// ── Post-Typ Label-Mapping ────────────────────────────────────────

const POST_TYPE_OPTIONS = [
  { value: 'TEXT',            label: 'Allgemein' },
  { value: 'TIP',             label: 'Tipp' },
  { value: 'QUESTION',        label: 'Frage' },
  { value: 'ACHIEVEMENT',     label: 'Meilenstein' },
  { value: 'TRAINING_UPDATE', label: 'Training-Update' },
  { value: 'MOTIVATION',      label: 'Motivation' },
] as const

type PostTypeValue = typeof POST_TYPE_OPTIONS[number]['value']

const PLACEHOLDER_BY_TYPE: Record<PostTypeValue, string> = {
  TEXT:            'Was möchtest du teilen?',
  TIP:             'Welchen Tipp hast du für andere Sportler?',
  QUESTION:        'Was möchtest du fragen?',
  ACHIEVEMENT:     'Was hast du erreicht? Teile deinen Erfolg!',
  TRAINING_UPDATE: 'Wie war dein Training heute?',
  MOTIVATION:      'Teile deine Motivation mit der Community!',
}

// ── Hilfsfunktionen ───────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

// Zähler-Farbe
function getCounterColor(len: number): string {
  if (len >= 2000) return 'text-red-400'
  if (len >= 1800) return 'text-orange-400'
  return 'text-white/30'
}

// ── Komponente ───────────────────────────────────────────────────

export function PostComposer({
  currentUser,
  sports,
  onPostCreated,
  onError,
}: PostComposerProps) {
  const [content, setContent] = useState('')
  const [selectedSportId, setSelectedSportId] = useState<string>(
    currentUser.sports[0]?.id ?? sports[0]?.id ?? ''
  )
  const [selectedType, setSelectedType] = useState<PostTypeValue>('TEXT')
  const [mediaFile, setMediaFile] = useState<File | null>(null)
  const [mediaPreview, setMediaPreview] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showTypeDropdown, setShowTypeDropdown] = useState(false)
  const [showSportDropdown, setShowSportDropdown] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-resize textarea
  const autoResize = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 300)}px`
  }, [])

  useEffect(() => {
    autoResize()
  }, [content, autoResize])

  // Sport-Name auflösen
  const selectedSport = [...currentUser.sports, ...sports].find(
    (s) => s.id === selectedSportId
  ) ?? sports[0]

  // Post-Typ-Label
  const selectedTypeLabel = POST_TYPE_OPTIONS.find(
    (o) => o.value === selectedType
  )?.label ?? 'Allgemein'

  // ── Media Upload Handler ───────────────────────────────────────

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      // Dateigröße prüfen (5 MB)
      if (file.size > 5 * 1024 * 1024) {
        onError('Datei zu groß – maximal 5 MB erlaubt')
        return
      }

      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')

      if (!isImage && !isVideo) {
        onError('Nur Bilder und Videos erlaubt')
        return
      }

      // Lokale Preview
      const url = URL.createObjectURL(file)
      setMediaPreview(url)
      setMediaFile(file)
      setMediaType(isImage ? 'image' : 'video')
      setUploadProgress(0)
    },
    [onError]
  )

  const removeMedia = useCallback(() => {
    if (mediaPreview) URL.revokeObjectURL(mediaPreview)
    setMediaFile(null)
    setMediaPreview(null)
    setMediaType(null)
    setUploadProgress(0)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [mediaPreview])

  // ── Submit ────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || isSubmitting) return

    setIsSubmitting(true)

    let uploadedMediaUrl: string | null = null
    let uploadedMediaType: string | null = null

    // Datei hochladen wenn vorhanden
    if (mediaFile && mediaType) {
      setIsUploading(true)
      try {
        const supabase = createBrowserClient()
        const ext = mediaFile.name.split('.').pop() ?? 'bin'
        const path = `posts-media/${currentUser.id}/${Date.now()}.${ext}`

        const { error } = await supabase.storage
          .from('media')
          .upload(path, mediaFile, { upsert: false })

        if (error) throw error

        const { data } = supabase.storage.from('media').getPublicUrl(path)
        uploadedMediaUrl = data.publicUrl
        uploadedMediaType = mediaType
        setUploadProgress(100)
      } catch {
        onError('Medien-Upload fehlgeschlagen. Bitte erneut versuchen.')
        setIsUploading(false)
        setIsSubmitting(false)
        return
      }
      setIsUploading(false)
    }

    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content.trim(),
          sportId: selectedSportId,
          type: selectedType,
          mediaUrl: uploadedMediaUrl,
          mediaType: uploadedMediaType,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        onError(err.error ?? 'Post konnte nicht erstellt werden')
        setIsSubmitting(false)
        return
      }

      const data = await res.json() as { post: FeedPost }

      // Reset
      setContent('')
      removeMedia()
      setSelectedType('TEXT')

      onPostCreated(data.post)
    } catch {
      onError('Verbindungsfehler. Bitte erneut versuchen.')
    }

    setIsSubmitting(false)
  }, [
    content,
    isSubmitting,
    mediaFile,
    mediaType,
    currentUser.id,
    selectedSportId,
    selectedType,
    onPostCreated,
    onError,
    removeMedia,
  ])

  const canSubmit = content.trim().length > 0 && !isSubmitting && !isUploading

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {currentUser.image ? (
            <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-white/20">
              <Image
                src={currentUser.image}
                alt={currentUser.name ?? 'Avatar'}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-white/20"
              style={{ backgroundColor: selectedSport?.colorPrimary ?? '#16A34A' }}
            >
              {getInitials(currentUser.name)}
            </div>
          )}
        </div>

        {/* Input-Bereich */}
        <div className="flex-1 min-w-0">
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => {
              if (e.target.value.length <= 2000) setContent(e.target.value)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSubmit()
            }}
            placeholder={PLACEHOLDER_BY_TYPE[selectedType]}
            rows={1}
            className="w-full bg-transparent text-white placeholder-white/30 text-sm resize-none outline-none leading-relaxed"
            style={{ minHeight: '40px', maxHeight: '300px' }}
          />

          {/* Media Preview */}
          <AnimatePresence>
            {mediaPreview && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <div className="relative inline-block">
                  {mediaType === 'image' ? (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden">
                      <Image
                        src={mediaPreview}
                        alt="Vorschau"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <video
                      src={mediaPreview}
                      className="w-20 h-20 object-cover rounded-lg"
                      muted
                    />
                  )}
                  <button
                    onClick={removeMedia}
                    className="absolute -top-2 -right-2 bg-[#0A0A0A] rounded-full p-0.5 border border-white/20 hover:bg-white/10 transition-colors"
                  >
                    <X size={12} className="text-white/60" />
                  </button>

                  {/* Upload Progress Ring */}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center">
                      <div className="relative w-8 h-8">
                        <svg className="w-8 h-8 -rotate-90" viewBox="0 0 32 32">
                          <circle
                            cx="16" cy="16" r="12"
                            fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="3"
                          />
                          <circle
                            cx="16" cy="16" r="12"
                            fill="none" stroke="white" strokeWidth="3"
                            strokeDasharray={`${2 * Math.PI * 12}`}
                            strokeDashoffset={`${2 * Math.PI * 12 * (1 - uploadProgress / 100)}`}
                            className="transition-all duration-300"
                          />
                        </svg>
                        <span className="absolute inset-0 flex items-center justify-center text-white text-[9px] font-bold">
                          {uploadProgress}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Toolbar */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-2">
              {/* Media-Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/50 hover:text-white/80"
                title="Bild oder Video anhängen"
              >
                <ImageIcon size={16} />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Sport-Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSportDropdown((v) => !v)
                    setShowTypeDropdown(false)
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border border-white/15 hover:border-white/30 transition-colors"
                  style={{ color: selectedSport?.colorPrimary ?? '#16A34A' }}
                >
                  {selectedSport?.name ?? 'Sport'}
                  <ChevronDown size={12} />
                </button>

                <AnimatePresence>
                  {showSportDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute left-0 top-full mt-1 z-50 bg-[#111] border border-white/15 rounded-xl overflow-hidden shadow-xl min-w-[140px]"
                    >
                      {sports.map((sport) => (
                        <button
                          key={sport.id}
                          onClick={() => {
                            setSelectedSportId(sport.id)
                            setShowSportDropdown(false)
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors flex items-center gap-2"
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: sport.colorPrimary }}
                          />
                          <span className="text-white/80">{sport.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Typ-Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowTypeDropdown((v) => !v)
                    setShowSportDropdown(false)
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border border-white/15 text-white/50 hover:border-white/30 hover:text-white/70 transition-colors"
                >
                  {selectedTypeLabel}
                  <ChevronDown size={12} />
                </button>

                <AnimatePresence>
                  {showTypeDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute left-0 top-full mt-1 z-50 bg-[#111] border border-white/15 rounded-xl overflow-hidden shadow-xl min-w-[160px]"
                    >
                      {POST_TYPE_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => {
                            setSelectedType(opt.value)
                            setShowTypeDropdown(false)
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-white/10 transition-colors text-white/80"
                        >
                          {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Rechte Seite: Zeichenzähler + Submit */}
            <div className="flex items-center gap-3">
              {content.length > 0 && (
                <span className={`text-xs tabular-nums ${getCounterColor(content.length)}`}>
                  {content.length}/2000
                </span>
              )}
              <button
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: canSubmit
                    ? (selectedSport?.colorPrimary ?? '#16A34A')
                    : 'rgba(255,255,255,0.1)',
                  color: 'white',
                }}
              >
                {isSubmitting ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Send size={14} />
                )}
                Posten
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Klick außerhalb schließt Dropdowns */}
      {(showTypeDropdown || showSportDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowTypeDropdown(false)
            setShowSportDropdown(false)
          }}
        />
      )}
    </div>
  )
}
