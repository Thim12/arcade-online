'use client'

// ─────────────────────────────────────────────────────────────────
// PostCard.tsx – Einzelne Post-Karte im Community-Feed
// Like (optimistic, spring-Animation), Kommentare, Teilen,
// Radix DropdownMenu (bearbeiten/löschen/melden),
// Report-Modal (Radix Dialog), Kommentar-Sektion (Framer Motion)
// ─────────────────────────────────────────────────────────────────

import { useState, useCallback, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Dialog from '@radix-ui/react-dialog'
import {
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Pencil,
  Trash2,
  Flag,
  Link2,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { FeedPost } from './Feed'

// ── Typen ────────────────────────────────────────────────────────

interface Comment {
  id: string
  content: string
  createdAt: string
  user: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    level: number
  }
}

interface PostCardProps {
  post: FeedPost
  currentUserId: string
  currentUserRole?: string
  onDelete: (postId: string) => void
  onUpdate: (postId: string, content: string) => void
}

// ── Hilfsfunktionen ───────────────────────────────────────────────

function getInitials(name: string | null): string {
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'Gerade eben'
  if (minutes < 60) return `vor ${minutes} Min.`
  if (hours < 24) return `vor ${hours} Std.`
  if (days < 7) return `vor ${days} Tag${days !== 1 ? 'en' : ''}`
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })
}

const POST_TYPE_LABELS: Record<string, string> = {
  TEXT:            'Allgemein',
  TIP:             'Tipp',
  QUESTION:        'Frage',
  ACHIEVEMENT:     'Meilenstein',
  MATCH_RESULT:    'Spielbericht',
  TRAINING_UPDATE: 'Training-Update',
  MOTIVATION:      'Motivation',
}

const POST_TYPE_COLORS: Record<string, string> = {
  TIP:             'text-green-400 bg-green-400/10',
  QUESTION:        'text-blue-400 bg-blue-400/10',
  ACHIEVEMENT:     'text-yellow-400 bg-yellow-400/10',
  MATCH_RESULT:    'text-purple-400 bg-purple-400/10',
  TRAINING_UPDATE: 'text-orange-400 bg-orange-400/10',
  MOTIVATION:      'text-pink-400 bg-pink-400/10',
  TEXT:            'text-white/40 bg-white/5',
}

const REPORT_REASONS = [
  { value: 'SPAM',                  label: 'Spam oder Werbung' },
  { value: 'BELEIDIGUNG',           label: 'Beleidigung oder Hassrede' },
  { value: 'UNANGEMESSENER_INHALT', label: 'Unangemessener Inhalt' },
  { value: 'FALSCHE_INFORMATION',   label: 'Falsche Informationen' },
]

// ── Komponente ───────────────────────────────────────────────────

export function PostCard({
  post,
  currentUserId,
  currentUserRole = 'USER',
  onDelete,
  onUpdate,
}: PostCardProps) {
  const isOwner = post.user.id === currentUserId
  const isAdmin = currentUserRole === 'ADMIN'

  // ── Like State ────────────────────────────────────────────────
  const [liked, setLiked] = useState(post.isLikedByMe)
  const [likeCount, setLikeCount] = useState(post.likeCount)
  const [isLiking, setIsLiking] = useState(false)
  const [heartPop, setHeartPop] = useState(false)

  // ── Kommentar State ───────────────────────────────────────────
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentCount, setCommentCount] = useState(post.commentCount)
  const [loadingComments, setLoadingComments] = useState(false)
  const [commentInput, setCommentInput] = useState('')
  const [isPostingComment, setIsPostingComment] = useState(false)

  // ── Expand Text ───────────────────────────────────────────────
  const [expanded, setExpanded] = useState(false)
  const contentRef = useRef<HTMLParagraphElement>(null)
  const [isLongText, setIsLongText] = useState(false)

  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    setIsLongText(el.scrollHeight > el.clientHeight)
  }, [])

  // ── Report Modal ──────────────────────────────────────────────
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState<string>('')
  const [isReporting, setIsReporting] = useState(false)
  const [reportDone, setReportDone] = useState(false)

  // ── Edit State ────────────────────────────────────────────────
  const [editOpen, setEditOpen] = useState(false)
  const [editContent, setEditContent] = useState(post.content)
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // ── Like Toggle ───────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (isLiking) return
    setIsLiking(true)

    // Optimistic
    const newLiked = !liked
    setLiked(newLiked)
    setLikeCount((c) => c + (newLiked ? 1 : -1))
    if (newLiked) {
      setHeartPop(true)
      setTimeout(() => setHeartPop(false), 600)
    }

    try {
      const res = await fetch(`/api/posts/${post.id}/like`, { method: 'POST' })
      if (!res.ok) {
        // Rollback
        setLiked(!newLiked)
        setLikeCount((c) => c + (newLiked ? -1 : 1))
      }
    } catch {
      setLiked(!newLiked)
      setLikeCount((c) => c + (newLiked ? -1 : 1))
    }
    setIsLiking(false)
  }, [liked, isLiking, post.id])

  // ── Kommentare laden ──────────────────────────────────────────
  const loadComments = useCallback(async () => {
    if (loadingComments) return
    setLoadingComments(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/comment`)
      if (res.ok) {
        const data = await res.json() as { comments: Comment[] }
        setComments(data.comments)
      }
    } catch {
      // still show empty list
    }
    setLoadingComments(false)
  }, [post.id, loadingComments])

  const toggleComments = useCallback(() => {
    const next = !commentsOpen
    setCommentsOpen(next)
    if (next && comments.length === 0) loadComments()
  }, [commentsOpen, comments.length, loadComments])

  // ── Kommentar absenden ────────────────────────────────────────
  const handleComment = useCallback(async () => {
    if (!commentInput.trim() || isPostingComment) return
    setIsPostingComment(true)
    try {
      const res = await fetch(`/api/posts/${post.id}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentInput.trim() }),
      })
      if (res.ok) {
        const data = await res.json() as { comment: Comment; commentCount: number }
        setComments((prev) => [...prev, data.comment])
        setCommentCount(data.commentCount)
        setCommentInput('')
      }
    } catch {
      // silent
    }
    setIsPostingComment(false)
  }, [commentInput, isPostingComment, post.id])

  // ── Teilen ────────────────────────────────────────────────────
  const handleShare = useCallback(async () => {
    const url = `${window.location.origin}/community#${post.id}`
    if (navigator.share) {
      await navigator.share({ title: 'SportRise Post', url }).catch(() => null)
    } else {
      await navigator.clipboard.writeText(url).catch(() => null)
    }
  }, [post.id])

  // ── Post löschen ──────────────────────────────────────────────
  const handleDelete = useCallback(async () => {
    const res = await fetch(`/api/posts/${post.id}`, { method: 'DELETE' })
    if (res.ok) onDelete(post.id)
  }, [post.id, onDelete])

  // ── Post bearbeiten ───────────────────────────────────────────
  const handleSaveEdit = useCallback(async () => {
    if (!editContent.trim() || isSavingEdit) return
    setIsSavingEdit(true)
    const res = await fetch(`/api/posts/${post.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: editContent.trim() }),
    })
    if (res.ok) {
      onUpdate(post.id, editContent.trim())
      setEditOpen(false)
    }
    setIsSavingEdit(false)
  }, [editContent, isSavingEdit, post.id, onUpdate])

  // ── Report absenden ───────────────────────────────────────────
  const handleReport = useCallback(async () => {
    if (!reportReason || isReporting) return
    setIsReporting(true)
    const res = await fetch(`/api/posts/${post.id}/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: reportReason }),
    })
    if (res.ok) setReportDone(true)
    setIsReporting(false)
  }, [reportReason, isReporting, post.id])

  // ── Link kopieren ─────────────────────────────────────────────
  const handleCopyLink = useCallback(async () => {
    const url = `${window.location.origin}/community#${post.id}`
    await navigator.clipboard.writeText(url).catch(() => null)
  }, [post.id])

  return (
    <>
      <motion.article
        id={post.id}
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.25 }}
        className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm"
      >
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="flex items-start gap-3 p-4 pb-0">
          {/* Avatar */}
          <div className="flex-shrink-0">
            {post.user.image ? (
              <div className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-white/15">
                <Image src={post.user.image} alt={post.user.name ?? 'Avatar'} fill className="object-cover" />
              </div>
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold ring-2 ring-white/15"
                style={{ backgroundColor: post.sport.colorPrimary }}
              >
                {getInitials(post.user.name)}
              </div>
            )}
          </div>

          {/* Meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-white truncate">
                {post.user.name ?? 'Unbekannt'}
              </span>
              {post.user.username && (
                <span className="text-xs text-white/40">@{post.user.username}</span>
              )}
              <span className="text-xs text-white/25">·</span>
              <span className="text-xs text-white/40">{formatRelativeTime(post.createdAt)}</span>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
              <span
                className="text-xs px-1.5 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: `${post.sport.colorPrimary}20`,
                  color: post.sport.colorPrimary,
                }}
              >
                {post.sport.name}
              </span>
              {post.type !== 'TEXT' && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${POST_TYPE_COLORS[post.type] ?? POST_TYPE_COLORS.TEXT}`}>
                  {POST_TYPE_LABELS[post.type] ?? post.type}
                </span>
              )}
              {post.isPinned && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-white/5 text-white/40">
                  Angepinnt
                </span>
              )}
            </div>
          </div>

          {/* MoreHorizontal Dropdown */}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button className="flex-shrink-0 p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white/70">
                <MoreHorizontal size={16} />
              </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={4}
                className="z-50 min-w-[180px] bg-[#111] border border-white/15 rounded-xl shadow-xl overflow-hidden py-1"
              >
                {(isOwner || isAdmin) && (
                  <>
                    <DropdownMenu.Item
                      onSelect={() => setEditOpen(true)}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 cursor-pointer outline-none transition-colors"
                    >
                      <Pencil size={14} />
                      Bearbeiten
                    </DropdownMenu.Item>
                    <DropdownMenu.Item
                      onSelect={handleDelete}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-400/10 cursor-pointer outline-none transition-colors"
                    >
                      <Trash2 size={14} />
                      Löschen
                    </DropdownMenu.Item>
                    <DropdownMenu.Separator className="h-px bg-white/10 my-1" />
                  </>
                )}

                {!isOwner && (
                  <DropdownMenu.Item
                    onSelect={() => setReportOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-orange-400 hover:text-orange-300 hover:bg-orange-400/10 cursor-pointer outline-none transition-colors"
                  >
                    <Flag size={14} />
                    Melden
                  </DropdownMenu.Item>
                )}

                <DropdownMenu.Item
                  onSelect={handleCopyLink}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:text-white hover:bg-white/10 cursor-pointer outline-none transition-colors"
                >
                  <Link2 size={14} />
                  Link kopieren
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>

        {/* ── Inhalt ─────────────────────────────────────────────── */}
        <div className="px-4 pt-3">
          {post.title && (
            <h3 className="text-sm font-semibold text-white mb-1">{post.title}</h3>
          )}

          <div className="relative">
            <p
              ref={contentRef}
              className={`text-sm text-white/80 leading-relaxed whitespace-pre-wrap ${!expanded ? 'line-clamp-4' : ''}`}
            >
              {post.content}
            </p>
            {isLongText && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-xs text-white/40 hover:text-white/60 transition-colors mt-1 flex items-center gap-1"
              >
                {expanded ? (
                  <><ChevronUp size={12} /> Weniger anzeigen</>
                ) : (
                  <><ChevronDown size={12} /> Mehr anzeigen</>
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Media ──────────────────────────────────────────────── */}
        {post.mediaUrl && (
          <div className="mt-3 mx-4 rounded-xl overflow-hidden border border-white/10" style={{ maxHeight: 400 }}>
            {post.mediaType === 'video' ? (
              <video
                src={post.mediaUrl}
                controls
                className="w-full object-cover"
                style={{ maxHeight: 400 }}
              />
            ) : (
              <div className="relative w-full" style={{ aspectRatio: '4/3' }}>
                <Image
                  src={post.mediaUrl}
                  alt="Post-Medien"
                  fill
                  className="object-cover"
                />
              </div>
            )}
          </div>
        )}

        {/* ── Aktions-Leiste ──────────────────────────────────────── */}
        <div className="flex items-center gap-1 px-4 py-3 mt-1">
          {/* Like */}
          <button
            onClick={handleLike}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 transition-all group"
          >
            <motion.div
              animate={heartPop ? { scale: [1, 1.5, 1] } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 12 }}
            >
              <Heart
                size={16}
                className={`transition-colors ${liked ? 'fill-red-400 text-red-400' : 'text-white/40 group-hover:text-white/70'}`}
              />
            </motion.div>
            <span className={`text-xs font-medium tabular-nums ${liked ? 'text-red-400' : 'text-white/40 group-hover:text-white/70'}`}>
              {likeCount > 0 ? likeCount : ''}
            </span>
          </button>

          {/* Kommentare */}
          <button
            onClick={toggleComments}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 transition-all group"
          >
            <MessageCircle size={16} className="text-white/40 group-hover:text-white/70 transition-colors" />
            <span className="text-xs font-medium text-white/40 group-hover:text-white/70 tabular-nums transition-colors">
              {commentCount > 0 ? commentCount : ''}
            </span>
          </button>

          {/* Teilen */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-white/10 transition-all group"
          >
            <Share2 size={16} className="text-white/40 group-hover:text-white/70 transition-colors" />
          </button>
        </div>

        {/* ── Kommentar-Sektion ───────────────────────────────────── */}
        <AnimatePresence>
          {commentsOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-white/10"
            >
              <div className="px-4 py-3 space-y-3">
                {loadingComments && (
                  <div className="flex justify-center py-2">
                    <Loader2 size={16} className="animate-spin text-white/30" />
                  </div>
                )}

                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-2">
                    {comment.user.image ? (
                      <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0">
                        <Image src={comment.user.image} alt={comment.user.name ?? ''} fill className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/60 flex-shrink-0">
                        {getInitials(comment.user.name)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-xs font-semibold text-white/80">
                          {comment.user.name ?? 'Unbekannt'}
                        </span>
                        <span className="text-xs text-white/25">{formatRelativeTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{comment.content}</p>
                    </div>
                  </div>
                ))}

                {/* Kommentar-Input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleComment() } }}
                    placeholder="Kommentar schreiben..."
                    maxLength={500}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/30 outline-none focus:border-white/25 transition-colors"
                  />
                  <button
                    onClick={handleComment}
                    disabled={!commentInput.trim() || isPostingComment}
                    className="px-3 py-2 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isPostingComment ? <Loader2 size={12} className="animate-spin" /> : 'Senden'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.article>

      {/* ── Edit-Dialog ─────────────────────────────────────────────── */}
      <Dialog.Root open={editOpen} onOpenChange={setEditOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-[#111] border border-white/15 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-base font-semibold text-white">Post bearbeiten</Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white/70">
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value.slice(0, 2000))}
              rows={5}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors resize-none"
            />
            <p className="text-xs text-white/30 text-right mt-1">{editContent.length}/2000</p>
            <div className="flex justify-end gap-2 mt-4">
              <Dialog.Close asChild>
                <button className="px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
                  Abbrechen
                </button>
              </Dialog.Close>
              <button
                onClick={handleSaveEdit}
                disabled={!editContent.trim() || isSavingEdit}
                className="px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSavingEdit && <Loader2 size={14} className="animate-spin" />}
                Speichern
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* ── Report-Dialog ────────────────────────────────────────────── */}
      <Dialog.Root open={reportOpen} onOpenChange={(v) => { setReportOpen(v); if (!v) { setReportDone(false); setReportReason('') } }}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
          <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-[#111] border border-white/15 rounded-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <Dialog.Title className="text-base font-semibold text-white">Post melden</Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-white/40 hover:text-white/70">
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>

            {reportDone ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-green-400/10 flex items-center justify-center mx-auto mb-3">
                  <Flag size={20} className="text-green-400" />
                </div>
                <p className="text-sm text-white/70">Danke für deine Meldung. Wir prüfen den Inhalt.</p>
                <Dialog.Close asChild>
                  <button className="mt-4 px-4 py-2 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition-all">
                    Schließen
                  </button>
                </Dialog.Close>
              </div>
            ) : (
              <>
                <p className="text-xs text-white/50 mb-4">Warum möchtest du diesen Post melden?</p>
                <div className="space-y-2">
                  {REPORT_REASONS.map((reason) => (
                    <button
                      key={reason.value}
                      onClick={() => setReportReason(reason.value)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all border ${
                        reportReason === reason.value
                          ? 'border-orange-400/40 bg-orange-400/10 text-orange-300'
                          : 'border-white/10 text-white/60 hover:border-white/20 hover:text-white/80'
                      }`}
                    >
                      {reason.label}
                    </button>
                  ))}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Dialog.Close asChild>
                    <button className="px-4 py-2 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all">
                      Abbrechen
                    </button>
                  </Dialog.Close>
                  <button
                    onClick={handleReport}
                    disabled={!reportReason || isReporting}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isReporting && <Loader2 size={14} className="animate-spin" />}
                    Melden
                  </button>
                </div>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  )
}
