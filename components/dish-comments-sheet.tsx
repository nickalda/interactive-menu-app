"use client"

import { useEffect } from "react"
import { Heart, MessageCircle, Star, X } from "lucide-react"
import type { Dish, DishComment } from "@/lib/types"
import { cn } from "@/lib/utils"

type DishCommentsSheetProps = {
  dish: Dish | null
  comments: DishComment[]
  loading: boolean
  onClose: () => void
}

export function DishCommentsSheet({ dish, comments, loading, onClose }: DishCommentsSheetProps) {
  const open = dish !== null

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }

    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

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
              ) : comments.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No comments yet for this dish.
                </div>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <article key={comment.id} className="rounded-2xl border border-border bg-secondary/60 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, index) => (
                            <Star
                              key={`${comment.id}-${index}`}
                              className={cn("size-4", index < comment.rating ? "fill-accent text-accent" : "text-muted-foreground")}
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
                        <Heart className="size-4" />
                        <span>{comment.likes}</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
