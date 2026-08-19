"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Script from "next/script"
import { X, Plus, Star, Flame, Clock, Heart, Bookmark, ScanSearch } from "lucide-react"
import type { Dish } from "@/lib/types"
import { cn } from "@/lib/utils"

const sharedArModelPath = "/3D/burger+3d+model.glb"

type ModelViewerElement = HTMLElement & {
  activateAR?: () => Promise<void> | void
}

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
  const modelViewerRef = useRef<ModelViewerElement | null>(null)
  const [arReady, setArReady] = useState(false)
  const [arError, setArError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  useEffect(() => {
    if (typeof window === "undefined") return
    if (customElements.get("model-viewer")) {
      setArReady(true)
      return
    }

    customElements.whenDefined("model-viewer").then(() => {
      setArReady(true)
    })
  }, [])

  useEffect(() => {
    if (!open) {
      setArError(null)
    }
  }, [open])

  async function openArExperience() {
    if (typeof window === "undefined") return

    const userAgent = window.navigator.userAgent.toLowerCase()
    const isMobileArBrowser = /android|iphone|ipad|ipod/.test(userAgent)

    if (!isMobileArBrowser) {
      setArError("AR opens on Android and iPhone/iPad browsers. Use a mobile device to launch the camera.")
      return
    }

    if (!arReady || !modelViewerRef.current?.activateAR) {
      setArError("The AR viewer is still loading. Try again in a moment.")
      return
    }

    setArError(null)

    try {
      await modelViewerRef.current.activateAR()
    } catch {
      setArError("This browser could not launch AR. Use Chrome on Android or Safari/Chrome on iPhone/iPad.")
    }
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition-opacity duration-300",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!open}
    >
      <Script
        type="module"
        src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"
        strategy="afterInteractive"
        onLoad={() => setArReady(true)}
      />

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

              <div className="mt-4 rounded-3xl border border-primary/20 bg-primary/10 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wide text-foreground">Augmented Reality</p>
                    <p className="mt-1 text-xs text-muted-foreground">Open the camera and place this dish in your space.</p>
                  </div>
                  <button
                    type="button"
                    onClick={openArExperience}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!dish}
                  >
                    <ScanSearch className="size-4" />
                    View in AR
                  </button>
                </div>
                {arError ? <p className="mt-2 text-xs font-medium text-primary">{arError}</p> : null}
              </div>

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

              <model-viewer
                ref={modelViewerRef}
                src={sharedArModelPath}
                ar
                ar-modes="webxr scene-viewer quick-look"
                camera-controls
                touch-action="pan-y"
                shadow-intensity="1"
                alt={`${dish.name} augmented reality model`}
                className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
              />
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
