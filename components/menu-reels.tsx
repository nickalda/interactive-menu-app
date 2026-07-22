"use client"

import { useEffect, useMemo, useState } from "react"
import { ShoppingBag } from "lucide-react"
import type { Dish } from "@/lib/types"
import { ReelCard } from "@/components/reel-card"
import { DishDetailsSheet } from "@/components/dish-details-sheet"
import { CartDrawer, type CartLine } from "@/components/cart-drawer"
import { cn } from "@/lib/utils"

type CategoryChip = { label: string; value: string }

function normalizeCategory(value: unknown) {
  const text = typeof value === "string" ? value : value == null ? "" : String(value)
  return text.trim().toLowerCase()
}

export function MenuReels() {
  const [menu, setMenu] = useState<Dish[]>([])
  const [categories, setCategories] = useState<CategoryChip[]>([{ label: "All", value: "all" }])
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [cart, setCart] = useState<Record<string, number>>({})
  const [category, setCategory] = useState<string>("all")
  const [detailsDish, setDetailsDish] = useState<Dish | null>(null)
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let canceled = false

    async function loadMenu() {
      try {
        const res = await fetch('/api/menu')
        if (!res.ok) {
          const body = await res.text()
          if (canceled) return
          setError(`API error ${res.status}: ${body}`)
          setMenu([])
          setCategories([{ label: "All", value: "all" }])
          return
        }

        const data = (await res.json()) as {
          menu?: Dish[]
          categories?: Array<CategoryChip | string>
          error?: string
          warning?: string
        }
        if (canceled) return

        if (data.error || data.warning) {
          setError(data.error ? `API error: ${data.error}` : `Warning: ${data.warning}`)
          setMenu([])
          setCategories([{ label: "All", value: "all" }])
          return
        }

        const normalizedCategories = (Array.isArray(data.categories) ? data.categories : [])
          .map((entry) => {
            if (typeof entry === 'string') {
              const label = entry.trim()
              return label ? { label, value: label.toLowerCase() } : null
            }

            if (entry && typeof entry.label === 'string' && typeof entry.value === 'string') {
              const label = entry.label.trim()
              const value = entry.value.trim()
              return label && value ? { label, value } : null
            }

            return null
          })
          .filter((entry): entry is CategoryChip => entry !== null)

        setMenu(data.menu ?? [])
        setCategories([{ label: "All", value: "all" }, ...normalizedCategories])
      } catch (err) {
        if (canceled) return
        setError(err instanceof Error ? err.message : String(err))
        setMenu([])
        setCategories([{ label: "All", value: "all" }])
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    loadMenu()
    return () => {
      canceled = true
    }
  }, [])

  const visibleDishes = useMemo(() => {
    const activeCategory = normalizeCategory(category)

    console.log("[menu filter] selected category:", category)
    console.log("[menu filter] normalized category:", activeCategory)
    console.log("[menu filter] dishes:", menu.map((dish) => ({ id: dish.id, category: dish.category, normalized: normalizeCategory(dish.category) })))

    if (activeCategory === "all" || activeCategory === "") {
      return menu
    }

    const filtered = menu.filter((dish) => normalizeCategory(dish.categoryValue ?? dish.category) === activeCategory)
    console.log("[menu filter] filtered dishes:", filtered.map((dish) => dish.name))
    return filtered
  }, [category, menu])

  const cartLines: CartLine[] = useMemo(
    () =>
      menu
        .filter((d) => cart[d.id] > 0)
        .map((d) => ({ dish: d, qty: cart[d.id] })),
    [cart, menu],
  )

  const cartCount = Object.values(cart).reduce((sum, n) => sum + n, 0)

  function toggleLike(id: string) {
    setLiked((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSave(id: string) {
    setSaved((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function showToast(msg: string) {
    setToast(msg)
    window.clearTimeout((showToast as unknown as { _t?: number })._t)
    ;(showToast as unknown as { _t?: number })._t = window.setTimeout(() => setToast(null), 1800)
  }

  function addToCart(dish: Dish) {
    setCart((prev) => ({ ...prev, [dish.id]: (prev[dish.id] ?? 0) + 1 }))
    showToast(`${dish.name} added to order`)
  }

  function incItem(id: string) {
    setCart((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + 1 }))
  }

  function decItem(id: string) {
    setCart((prev) => {
      const qty = (prev[id] ?? 0) - 1
      const next = { ...prev }
      if (qty <= 0) delete next[id]
      else next[id] = qty
      return next
    })
  }

  function removeItem(id: string) {
    setCart((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  return (
    <main className="relative mx-auto h-[100dvh] w-full max-w-[480px] overflow-hidden bg-background">
      {/* Top bar */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col gap-3 bg-gradient-to-b from-black/70 to-transparent px-4 pb-6 pt-4">
        <div className="pointer-events-auto flex items-center justify-between">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-2xl uppercase tracking-tight text-white">Crave</span>
            <span className="font-display text-2xl uppercase tracking-tight text-primary">worthy</span>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white backdrop-blur-md">
            {saved.size > 0 ? `${saved.size} saved` : "Tap to explore"}
          </span>
        </div>

        {/* Category chips */}
        <div className="pointer-events-auto -mx-4 flex gap-2 overflow-x-auto px-4 no-scrollbar">
          {categories.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCategory(c.value)}
              className={cn(
                "shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors",
                category === c.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-white/20 bg-black/30 text-white backdrop-blur-md",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </header>

      {/* Reels scroll container */}
      <div
        key={category}
        className="h-[100dvh] w-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain no-scrollbar"
      >
        {loading ? (
          <div className="flex h-[100dvh] items-center justify-center text-white/80">Loading menu...</div>
        ) : error ? (
          <div className="flex h-[100dvh] items-center justify-center text-white/80">{error}</div>
        ) : visibleDishes.length === 0 ? (
          <div className="flex h-[100dvh] items-center justify-center text-white/80">No dishes found.</div>
        ) : (
          visibleDishes.map((dish, i) => (
            <ReelCard
              key={dish.id}
              dish={dish}
              index={i}
              isFirst={i === 0}
              liked={liked.has(dish.id)}
              saved={saved.has(dish.id)}
              cartQty={cart[dish.id] ?? 0}
              onToggleLike={() => toggleLike(dish.id)}
              onToggleSave={() => toggleSave(dish.id)}
              onOpenDetails={() => setDetailsDish(dish)}
              onAddToCart={() => addToCart(dish)}
            />
          ))
        )}
      </div>

      {/* Floating cart button */}
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        aria-label={`Open order, ${cartCount} items`}
        className="absolute bottom-6 right-4 z-30 flex items-center gap-2 rounded-full bg-accent px-5 py-3.5 font-bold text-accent-foreground shadow-lg transition-transform active:scale-95"
      >
        <ShoppingBag className="size-5" />
        {cartCount > 0 ? (
          <span className="min-w-5 rounded-full bg-accent-foreground/15 px-2 text-center text-sm">{cartCount}</span>
        ) : (
          <span className="text-sm">Order</span>
        )}
      </button>

      {/* Toast */}
      <div
        className={cn(
          "pointer-events-none absolute bottom-24 left-1/2 z-40 -translate-x-1/2 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background transition-all duration-300",
          toast ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        )}
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>

      <DishDetailsSheet
        dish={detailsDish}
        liked={detailsDish ? liked.has(detailsDish.id) : false}
        saved={detailsDish ? saved.has(detailsDish.id) : false}
        onClose={() => setDetailsDish(null)}
        onToggleLike={() => detailsDish && toggleLike(detailsDish.id)}
        onToggleSave={() => detailsDish && toggleSave(detailsDish.id)}
        onAddToCart={() => detailsDish && addToCart(detailsDish)}
      />

      <CartDrawer
        open={cartOpen}
        lines={cartLines}
        onClose={() => setCartOpen(false)}
        onInc={incItem}
        onDec={decItem}
        onRemove={removeItem}
      />
    </main>
  )
}
