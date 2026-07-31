"use client"

import { useEffect, useState } from "react"
import { Heart, MessageCircle, Send, Star, X } from "lucide-react"
import type { Dish, DishComment } from "@/lib/types"
import { cn } from "@/lib/utils"

type DishCommentsSheetProps = {
  dish: Dish | null
  comments: DishComment[]
  loading: boolean
  onClose: () => void
  onCommentAdded?: () => void
}

export function DishCommentsSheet({ dish, comments, loading, onClose, onCommentAdded }: DishCommentsSheetProps) {
  const open = dish !== null
  const [draft, setDraft] = useState("")
  const [rating, setRating] = useState(5)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [localComments, setLocalComments] = useState<DishComment[]>([])
  const [likedCommentIds, setLikedCommentIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!open) {
      setDraft("")
      setRating(5)
      setSubmitError(null)
    }
  }, [open])

  useEffect(() => {
    setLocalComments(comments)
  }, [comments])

  function toggleCommentLike(comment: DishComment) {
    const commentId = String(comment.id)

    if (likedCommentIds.has(commentId)) return

    setLikedCommentIds((prev) => new Set(prev).add(commentId))
    setLocalComments((prev) =>
      prev.map((item) => (String(item.id) === commentId ? { ...item, likes: item.likes + 1 } : item)),
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!dish || !draft.trim()) return

    setSubmitting(true)
    setSubmitError(null)

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dish_id: dish.id,
          comment: draft.trim(),
          rating,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(payload?.error || "Unable to save your comment.")
      }

      setDraft("")
      setRating(5)
      onCommentAdded?.()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Unable to save your comment.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] transition-opacity duration-300",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close comments"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={dish ? `${dish.name} comments` : "Dish comments"}
        className={cn(
          "absolute inset-x-0 bottom-0 mx-auto flex max-h-[88dvh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl border-t border-border bg-card transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full",
        )}
      >
        {dish ? (
          <>
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Comments</p>
                <h2 className="font-display text-2xl uppercase leading-none tracking-tight text-foreground">
                  {dish.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex size-9 items-center justify-center rounded-full bg-secondary text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
              <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="size-4 text-primary" />
                <span>
                  {comments.length} {comments.length === 1 ? "review" : "reviews"}
                </span>
              </div>

              {loading ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  Loading comments...
                </div>
              ) : localComments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No comments yet for this dish.
                </div>
              ) : (
                <div className="space-y-3">
                  {localComments.map((comment) => {
                    const commentId = String(comment.id)
                    const isLiked = likedCommentIds.has(commentId)

                    return (
                      <article key={comment.id} className="rounded-2xl border border-border bg-secondary/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={`${comment.id}-${index}`}
                              className={cn("size-4", index < comment.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground")}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(comment.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-foreground">{comment.comment}</p>

                      <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
                        <button
                          type="button"
                          onClick={() => toggleCommentLike(comment)}
                          aria-label="Like comment"
                          className="rounded-full p-1 transition-colors"
                        >
                          <Heart className={cn("size-4", isLiked ? "fill-red-500 text-red-500" : "text-muted-foreground")} />
                        </button>
                        <span>{comment.likes}</span>
                      </div>
                    </article>
                    )
                  })}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 rounded-2xl border border-border bg-secondary/50 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">Leave a comment</h3>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, index) => {
                      const value = index + 1
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          className="rounded-full p-1"
                          aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                        >
                          <Star className={cn("size-4", value <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground")} />
                        </button>
                      )
                    })}
                  </div>
                </div>

                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Share your experience with this dish..."
                  className="mt-3 min-h-24 w-full rounded-2xl border border-border bg-background px-3 py-3 text-sm text-foreground outline-none ring-0"
                />

                {submitError ? <p className="mt-2 text-sm text-destructive">{submitError}</p> : null}

                <button
                  type="submit"
                  disabled={submitting || !draft.trim()}
                  className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Send className="size-4" />
                  {submitting ? "Saving..." : "Post comment"}
                </button>
              </form>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
