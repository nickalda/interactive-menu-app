"use client"

import Image from "next/image"
import { Heart, Bookmark, Info, Plus, Star, Flame, Clock, ChevronUp } from "lucide-react"
import type { Dish } from "@/lib/types"
import { cn } from "@/lib/utils"

type ReelCardProps = {
  dish: Dish
  index: number
  isFirst: boolean
  liked: boolean
  saved: boolean
  cartQty: number
  onToggleLike: () => void
  onToggleSave: () => void
  onOpenDetails: () => void
  onAddToCart: () => void
}

function formatLikes(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`
}

function ActionButton({
  label,
  onClick,
  active,
  activeClass,
  children,
  caption,
}: {
  label: string
  onClick: () => void
  active?: boolean
  activeClass?: string
  children: React.ReactNode
  caption?: string
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={active}
        className={cn(
          "flex size-12 items-center justify-center rounded-full border border-white/15 bg-black/35 text-white backdrop-blur-md transition-transform active:scale-90",
          active && activeClass,
        )}
      >
        {children}
      </button>
      {caption ? <span className="text-xs font-semibold text-white/90 drop-shadow">{caption}</span> : null}
    </div>
  )
}

export function ReelCard({
  dish,
  isFirst,
  liked,
  saved,
  cartQty,
  onToggleLike,
  onToggleSave,
  onOpenDetails,
  onAddToCart,
}: ReelCardProps) {
  return (
    <section
      className="relative flex h-[100dvh] w-full snap-start snap-always items-end overflow-hidden"
      aria-label={`${dish.name} menu item`}
    >
      <Image
        src={dish.image || "/placeholder.svg"}
        alt={dish.name}
        fill
        priority={isFirst}
        sizes="(max-width: 768px) 100vw, 480px"
        className="object-cover"
      />

      {/* Legibility gradients */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/50" />

      {/* Rating badge below the header */}
      <div className="absolute left-4 top-28 flex items-center gap-2">
        <span className="flex items-center gap-1 rounded-full bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
          <Star className="size-3.5 fill-accent text-accent" />
          {dish.rating} · {dish.category}
        </span>
      </div>

      {/* Right action rail */}
      <div className="absolute bottom-44 right-3 z-20 flex flex-col items-center gap-5">
        <ActionButton
          label={liked ? "Unlike dish" : "Like dish"}
          onClick={onToggleLike}
          active={liked}
          activeClass="border-primary/60 bg-primary/25"
          caption={formatLikes(dish.likes + (liked ? 1 : 0))}
        >
          <Heart className={cn("size-6", liked && "fill-primary text-primary")} />
        </ActionButton>

        <ActionButton
          label={saved ? "Remove favorite" : "Save favorite"}
          onClick={onToggleSave}
          active={saved}
          activeClass="border-accent/60 bg-accent/25"
          caption="Save"
        >
          <Bookmark className={cn("size-6", saved && "fill-accent text-accent")} />
        </ActionButton>

        <ActionButton label="View details" onClick={onOpenDetails} caption="Info">
          <Info className="size-6" />
        </ActionButton>
      </div>

      {/* Bottom info block */}
      <div className="relative z-10 w-full px-4 pb-24">
        <div className="mb-2 flex items-center gap-3 text-xs font-medium text-white/80">
          <span className="flex items-center gap-1">
            <Clock className="size-3.5" />
            {dish.prepTime}
          </span>
          <span className="flex items-center gap-1">
            <Flame className={cn("size-3.5", dish.spicy > 0 ? "text-primary" : "text-white/50")} />
            {dish.spicy === 0 ? "Mild" : dish.spicy === 1 ? "Kick" : dish.spicy === 2 ? "Spicy" : "Fire"}
          </span>
          <span>{dish.calories} cal</span>
        </div>

        <h2 className="font-display text-5xl uppercase leading-[0.95] tracking-tight text-white text-balance">
          {dish.name}
        </h2>
        <p className="mt-2 max-w-[80%] text-pretty text-sm text-white/85">{dish.tagline}</p>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={onAddToCart}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-base font-bold text-primary-foreground transition-transform active:scale-[0.98]"
          >
            <Plus className="size-5" />
            Add to order
            {cartQty > 0 ? (
              <span className="ml-1 rounded-full bg-primary-foreground/20 px-2 py-0.5 text-sm">{cartQty}</span>
            ) : null}
          </button>
          <div className="rounded-full bg-white/10 px-4 py-3.5 text-lg font-bold text-white backdrop-blur-md">
            ${dish.price.toFixed(2)}
          </div>
        </div>
      </div>

      {isFirst ? (
        <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center text-white/70">
          <ChevronUp className="size-5 animate-bounce" />
          <span className="text-xs font-medium">Swipe up</span>
        </div>
      ) : null}
    </section>
  )
}
