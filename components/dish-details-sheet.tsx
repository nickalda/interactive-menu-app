"use client"

import { useEffect } from "react"
import Image from "next/image"
import { X, Plus, Star, Flame, Clock, Heart, Bookmark } from "lucide-react"
import type { Dish } from "@/lib/types"
import { cn } from "@/lib/utils"

type DishDetailsSheetProps = {
  dish: Dish | null
  liked: boolean
  saved: boolean
  onClose: () => void
  onToggleLike: () => void
  onToggleSave: () => void
  onAddToCart: () => void
}

export function DishDetailsSheet({
  dish,
  liked,
  saved,
  onClose,
  onToggleLike,
  onToggleSave,
  onAddToCart,
}: DishDetailsSheetProps) {
  const open = dish !== null
  const ingredients = dish ? (Array.isArray(dish.ingredients) ? dish.ingredients : []) : []
  const allergens = dish ? (Array.isArray(dish.allergens) ? dish.allergens : []) : []

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
        "fixed inset-0 z-50 transition-opacity duration-300",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        aria-label="Close details"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={dish ? `${dish.name} details` : "Dish details"}
        className={cn(
          "absolute inset-x-0 bottom-0 mx-auto flex max-h-[88dvh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-3xl border-t border-border bg-card transition-transform duration-300",
          open ? "translate-y-0" : "translate-y-full",
        )}
      >
        {dish ? (
          <>
            <div className="relative h-56 w-full shrink-0">
              <Image src={dish.image || "/placeholder.svg"} alt={dish.name} fill className="object-cover" sizes="480px" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-md"
              >
                <X className="size-5" />
              </button>
              <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-bold uppercase tracking-wider text-primary-foreground">
                {dish.category}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto px-5 pb-4 pt-4 no-scrollbar">
              <h2 className="font-display text-4xl uppercase leading-none tracking-tight text-foreground">
                {dish.name}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">{dish.description}</p>

              <div className="mt-5 grid grid-cols-4 gap-2">
                <Stat icon={<Star className="size-4 fill-accent text-accent" />} label="Rating" value={`${dish.rating}`} />
                <Stat icon={<Clock className="size-4 text-foreground" />} label="Prep" value={dish.prep_time} />
                <Stat
                  icon={<Flame className={cn("size-4", dish.spicy > 0 ? "text-primary" : "text-muted-foreground")} />}
                  label="Heat"
                  value={dish.spicy === 0 ? "Mild" : dish.spicy === 1 ? "Kick" : dish.spicy === 2 ? "Spicy" : "Fire"}
                />
                <Stat icon={<span className="text-sm font-bold text-foreground">kcal</span>} label="Energy" value={`${dish.calories}`} />
              </div>

              <div className="mt-6">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-foreground">Ingredients</h3>
                <div className="flex flex-wrap gap-2">
                  {ingredients.map((ing) => (
                    <span key={ing} className="rounded-full bg-secondary px-3 py-1.5 text-sm text-secondary-foreground">
                      {ing}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5">
                <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-foreground">Allergens</h3>
                {allergens.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {allergens.map((a) => (
                      <span
                        key={a}
                        className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No common allergens.</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-md">
              <button
                type="button"
                onClick={onToggleLike}
                aria-label={liked ? "Unlike" : "Like"}
                aria-pressed={liked}
                className={cn(
                  "flex size-12 items-center justify-center rounded-full border border-border bg-secondary text-foreground",
                  liked && "border-primary/60 bg-primary/20",
                )}
              >
                <Heart className={cn("size-5", liked && "fill-primary text-primary")} />
              </button>
              <button
                type="button"
                onClick={onToggleSave}
                aria-label={saved ? "Remove favorite" : "Save favorite"}
                aria-pressed={saved}
                className={cn(
                  "flex size-12 items-center justify-center rounded-full border border-border bg-secondary text-foreground",
                  saved && "border-accent/60 bg-accent/20",
                )}
              >
                <Bookmark className={cn("size-5", saved && "fill-accent text-accent")} />
              </button>
              <button
                type="button"
                onClick={onAddToCart}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-base font-bold text-primary-foreground transition-transform active:scale-[0.98]"
              >
                <Plus className="size-5" />
                Add · ${dish.price.toFixed(2)}
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-2xl bg-secondary py-3">
      <div className="flex h-5 items-center">{icon}</div>
      <span className="text-sm font-bold text-foreground">{value}</span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
    </div>
  )
}
