"use client"

import { useEffect, useMemo, useState } from "react"
import { Download, Home, Compass, Bookmark, ShoppingBag } from "lucide-react"
import type { Dish } from "@/lib/types"
import { ReelCard } from "@/components/reel-card"
import { DishDetailsSheet } from "@/components/dish-details-sheet"
import { CartDrawer, type CartLine } from "@/components/cart-drawer"
import { cn } from "@/lib/utils"

type NavTab = "home" | "discover" | "saved" | "cart"

export function MenuReels() {
  const [menu, setMenu] = useState<Dish[]>([])
  const [activeTab, setActiveTab] = useState<NavTab>("home")
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [cart, setCart] = useState<Record<string, number>>({})
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
          return
        }

        const data = (await res.json()) as {
          menu?: Dish[]
          error?: string
          warning?: string
        }
        if (canceled) return

        if (data.error || data.warning) {
          setError(data.error ? `API error: ${data.error}` : `Warning: ${data.warning}`)
          setMenu([])
          return
        }

        setMenu(data.menu ?? [])
      } catch (err) {
        if (canceled) return
        setError(err instanceof Error ? err.message : String(err))
        setMenu([])
      } finally {
        if (!canceled) setLoading(false)
      }
    }

    loadMenu()
    return () => {
      canceled = true
    }
  }, [])

  const homeDishes = useMemo(() => {
    const groups = new Map<number, Dish[]>()
    menu.forEach((dish) => {
      const likes = dish.likes ?? 0
      const group = groups.get(likes) ?? []
      group.push(dish)
      groups.set(likes, group)
    })
    return Array.from(groups.entries())
      .sort((a, b) => b[0] - a[0])
      .flatMap(([_, dishes]) => {
        for (let i = dishes.length - 1; i > 0; i -= 1) {
          const j = Math.floor(Math.random() * (i + 1))
          ;[dishes[i], dishes[j]] = [dishes[j], dishes[i]]
        }
        return dishes
      })
  }, [menu])

  const visibleDishes = useMemo(() => {
    if (activeTab === "home") {
      return homeDishes
    }

    if (activeTab === "saved") {
      return menu.filter((dish) => saved.has(dish.id))
    }

    return menu
  }, [activeTab, homeDishes, menu, saved])

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
    <main className="relative mx-auto h-screen w-full max-w-[480px] bg-background">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col gap-3 bg-gradient-to-b from-black/70 to-transparent px-4 pb-6 pt-4">
        <div className="pointer-events-auto flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-1">
            <span className="font-display text-2xl uppercase tracking-tight text-white">Crave</span>
            <span className="font-display text-2xl uppercase tracking-tight text-primary">worthy</span>
          </div>

        </div>

      </header>

      <div className="absolute inset-0 top-0 pb-28 pt-24">
        {loading ? (
          <div className="flex h-full items-center justify-center text-white/80">Loading menu...</div>
        ) : error ? (
          <div className="flex h-full items-center justify-center text-white/80">{error}</div>
        ) : activeTab === "cart" ? (
          <div className="px-4 py-4 text-white">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-white/60">Your order</p>
                  <p className="text-xl font-semibold">{cartCount > 0 ? `${cartCount} item${cartCount > 1 ? "s" : ""}` : "No items yet"}</p>
                </div>
                <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">{cartCount > 0 ? `${cartCount} selected` : "Empty"}</span>
              </div>

              {cartLines.length > 0 ? (
                <div className="space-y-3">
                  {cartLines.map((line) => (
                    <div key={line.dish.id} className="flex items-center justify-between rounded-2xl bg-black/20 px-3 py-3">
                      <div>
                        <p className="font-medium text-white">{line.dish.name}</p>
                        <p className="text-sm text-white/60">Qty {line.qty}</p>
                      </div>
                      <span className="text-sm font-semibold text-primary">x{line.qty}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/15 p-6 text-center text-sm text-white/70">
                  Tap dishes from the menu and they will appear here.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div key={activeTab} className="absolute inset-0 overflow-y-auto snap-y snap-mandatory overscroll-y-contain touch-pan-y no-scrollbar">
            {visibleDishes.length === 0 ? (
              <div className="flex h-full items-center justify-center text-white/80">No dishes found.</div>
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
        )}
      </div>

      <nav className="absolute inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black/80 px-2 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[440px] items-end justify-between gap-1">
          {[
            { key: "home", label: "Home", icon: Home },
            { key: "discover", label: "Discover", icon: Compass },
            { key: "download", label: "PDF", icon: Download },
            { key: "saved", label: "Saved", icon: Bookmark },
            { key: "cart", label: "Cart", icon: ShoppingBag },
          ].map((item) => {
            const Icon = item.icon

            if (item.key === "download") {
              return (
                <a
                  key={item.key}
                  href="/menu_PDF/Grave_Worthy_Menu.pdf"
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-full bg-primary px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-primary-foreground shadow-lg"
                >
                  <span className="flex items-center justify-center gap-1">
                    <Icon className="size-5" />
                    <span className="text-[10px]">{item.label}</span>
                  </span>
                </a>
              )
            }

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  if (item.key === "cart") {
                    setActiveTab("cart")
                    setCartOpen(true)
                  } else {
                    setActiveTab(item.key as NavTab)
                    setCartOpen(false)
                  }
                }}
                className={cn(
                  "flex-1 rounded-full px-2.5 py-2 text-center text-[10px] font-medium uppercase tracking-wide transition-colors",
                  activeTab === item.key ? "bg-white/15 text-white" : "text-white/70",
                )}
              >
                <span className="flex flex-col items-center justify-center gap-1">
                  <Icon className="size-5" />
                  <span className="text-[10px] leading-none">{item.label}</span>
                </span>
              </button>
            )
          })}
        </div>
      </nav>

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
