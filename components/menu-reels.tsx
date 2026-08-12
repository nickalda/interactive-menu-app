"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Download, Home, Compass, Bookmark, ShoppingBag } from "lucide-react"
import type { Dish, DishComment } from "@/lib/types"
import { ReelCard } from "@/components/reel-card"
import { DishDetailsSheet } from "@/components/dish-details-sheet"
import { DishCommentsSheet } from "@/components/dish-comments-sheet"
import { CartDrawer, type CartLine } from "@/components/cart-drawer"
import { ExploreLanding } from "@/components/explore-landing"
import { cn } from "@/lib/utils"

type NavTab = "home" | "discover" | "saved" | "cart"

export function MenuReels() {
  const [menu, setMenu] = useState<Dish[]>([])
  const [activeTab, setActiveTab] = useState<NavTab>("home")
  const [liked, setLiked] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [cart, setCart] = useState<Record<string, number>>({})
  const [detailsDish, setDetailsDish] = useState<Dish | null>(null)
  const [commentsDish, setCommentsDish] = useState<Dish | null>(null)
  const [comments, setComments] = useState<DishComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedDiet, setSelectedDiet] = useState<string | null>(null)
  const [selectedDishes, setSelectedDishes] = useState<Dish[]>([])

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

  const filteredMenu = useMemo(() => {
    let nextMenu = menu

    if (selectedCategory) {
      nextMenu = nextMenu.filter((dish) => dish.category === selectedCategory || dish.categoryValue === selectedCategory)
    }

    if (selectedDiet) {
      nextMenu = nextMenu.filter((dish) => {
        const normalized = dish.description.toLowerCase()
        if (selectedDiet === "vegan") return normalized.includes("vegan") || normalized.includes("plant")
        if (selectedDiet === "vegetarian") return normalized.includes("vegetarian") || normalized.includes("vegetable") || normalized.includes("cheese")
        if (selectedDiet === "gluten-free") return normalized.includes("gluten free") || normalized.includes("gluten-free") || normalized.includes("without gluten")
        return true
      })
    }

    return nextMenu
  }, [menu, selectedCategory, selectedDiet])

  const visibleDishes = useMemo(() => {
    if (activeTab === "home") {
      return homeDishes
    }

    if (activeTab === "saved") {
      return filteredMenu.filter((dish) => saved.has(dish.id))
    }

    if (activeTab === "discover") {
      return filteredMenu
    }

    return filteredMenu
  }, [activeTab, filteredMenu, homeDishes, saved])

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

  async function loadComments(dish: Dish) {
    setCommentsLoading(true)
    setCommentsDish(dish)
    setComments([])

    try {
      const { data, error } = await (await import("@/lib/supabase")).supabase
        .from("DishComment")
        .select("id, dish_id, comment, rating, created_at, likes")
        .eq("dish_id", dish.id)
        .eq("is_approved", true)
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Failed to load comments", error)
        setComments([])
        return
      }

      setComments((data ?? []) as DishComment[])
    } catch (err) {
      console.error("Failed to load comments", err)
      setComments([])
    } finally {
      setCommentsLoading(false)
    }
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

  function addToSelection(dish: Dish) {
    setSelectedDishes((prev) => {
      if (prev.some((item) => item.id === dish.id)) {
        return prev
      }
      return [...prev, dish]
    })
    addToCart(dish)
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

  function handleSelectCategory(category: string) {
    setSelectedCategory(category)
    setSelectedDiet(null)
    setActiveTab("discover")
    setCartOpen(false)
  }

  function handleSelectDiet(diet: string) {
    setSelectedDiet(diet)
    setSelectedCategory(null)
    setActiveTab("discover")
    setCartOpen(false)
  }

  function getCategoryImage(key: string) {
    const normalized = key.toLowerCase()
    const imageMap: Record<string, string> = {
      burgers: "/categories/burgers.png",
      "breakfast & brunch": "/categories/breakfast.png",
      drinks: "/categories/drinks.png",
      tacos: "/categories/tacos.png",
    }

    return imageMap[normalized] ?? "/placeholder.svg"
  }

  const exploreCategories = useMemo(() => {
    const counts = new Map<string, number>()
    menu.forEach((dish) => {
      const key = dish.category || dish.categoryValue
      counts.set(key, (counts.get(key) ?? 0) + 1)
    })

    return Array.from(counts.entries()).map(([key, count]) => ({
      id: key,
      label: key,
      description: `Browse ${key.toLowerCase()} dishes from the menu.`,
      image: getCategoryImage(key),
      count,
    }))
  }, [menu])

  const exploreDiets = useMemo(() => [
    {
      id: "vegan",
      label: "Vegan",
      description: "Plant-based favourites",
      count: menu.filter((dish) => dish.description.toLowerCase().includes("vegan") || dish.description.toLowerCase().includes("plant")).length,
    },
    {
      id: "vegetarian",
      label: "Vegetarian",
      description: "Vegetable-led dishes",
      count: menu.filter((dish) => dish.description.toLowerCase().includes("vegetarian") || dish.description.toLowerCase().includes("vegetable") || dish.description.toLowerCase().includes("cheese")).length,
    },
    {
      id: "gluten-free",
      label: "Gluten-free",
      description: "No gluten ingredients",
      count: menu.filter((dish) => dish.description.toLowerCase().includes("gluten free") || dish.description.toLowerCase().includes("gluten-free") || dish.description.toLowerCase().includes("without gluten")).length,
    },
  ], [menu])

  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col overflow-hidden bg-background">
      <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col gap-3 bg-gradient-to-b from-black/70 to-transparent px-4 pb-6 pt-[max(1rem,env(safe-area-inset-top))]">
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
        ) : activeTab === "discover" ? (
          <div key={activeTab} className="absolute inset-0 overflow-y-auto bg-background/95">
            {selectedCategory ? (
              <div className="mx-auto max-w-6xl px-4 pb-24 pt-12">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory(null)}
                    className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground"
                  >
                    ← Back
                  </button>
                  <h2 className="flex-1 text-center font-serif text-2xl text-foreground">
                    {selectedCategory}
                  </h2>
                  <span className="min-w-[2.5rem] rounded-full bg-primary/10 px-2.5 py-1 text-center text-xs font-semibold uppercase tracking-wide text-primary">
                    {filteredMenu.length}
                  </span>
                </div>

                {filteredMenu.length === 0 ? (
                  <div className="flex h-40 items-center justify-center rounded-2xl border border-dashed border-border text-sm text-muted-foreground">
                    No dishes found in this category.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredMenu.map((dish) => (
                      <div
                        key={dish.id}
                        className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                      >
                        <div className="relative h-28 w-full">
                          <Image
                            src={dish.image || "/placeholder.svg"}
                            alt={dish.name}
                            fill
                            sizes="(max-width: 640px) 50vw, 25vw"
                            className="object-cover"
                          />
                        </div>
                        <div className="space-y-3 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold leading-tight text-foreground">{dish.name}</p>
                            <span className="shrink-0 text-sm font-semibold text-primary">${dish.price.toFixed(2)}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => addToCart(dish)}
                              className="flex-1 rounded-full bg-primary px-2.5 py-2 text-xs font-semibold uppercase tracking-wide text-primary-foreground"
                            >
                              Add
                            </button>
                            <button
                              type="button"
                              onClick={() => setDetailsDish(dish)}
                              className="flex-1 rounded-full border border-border bg-background px-2.5 py-2 text-xs font-semibold uppercase tracking-wide text-foreground"
                            >
                              Info
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                <ExploreLanding
                  categories={exploreCategories}
                  diets={exploreDiets}
                  onSelectCategory={handleSelectCategory}
                  onSelectDiet={handleSelectDiet}
                />
              </>
            )}
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
                  onOpenComments={() => void loadComments(dish)}
                  onAddToCart={() => addToCart(dish)}
                />
              ))
            )}
          </div>
        )}
      </div>

      <nav className="absolute inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black/80 px-2 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
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

      <DishCommentsSheet
        dish={commentsDish}
        comments={comments}
        loading={commentsLoading}
        onClose={() => {
          setCommentsDish(null)
          setComments([])
        }}
        onCommentAdded={() => {
          if (commentsDish) {
            void loadComments(commentsDish)
          }
        }}
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
