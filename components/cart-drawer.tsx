"use client"

import { useEffect } from "react"
import Image from "next/image"
import { X, Plus, Minus, ShoppingBag, Trash2 } from "lucide-react"
import type { Dish } from "@/lib/types"
import { cn } from "@/lib/utils"

export type CartLine = { dish: Dish; qty: number }

type CartDrawerProps = {
  open: boolean
  lines: CartLine[]
  onClose: () => void
  onInc: (id: string) => void
  onDec: (id: string) => void
  onRemove: (id: string) => void
}

const TAX_RATE = 0.08

export function CartDrawer({ open, lines, onClose, onInc, onDec, onRemove }: CartDrawerProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, onClose])

  const subtotal = lines.reduce((sum, l) => sum + l.dish.price * l.qty, 0)
  const tax = subtotal * TAX_RATE
  const total = subtotal + tax
  const itemCount = lines.reduce((sum, l) => sum + l.qty, 0)

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 transition-opacity duration-300",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!open}
    >
      <button type="button" aria-label="Close cart" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Your order"
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-card transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="size-5 text-primary" />
            <h2 className="font-display text-2xl uppercase tracking-tight text-foreground">Your order</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-9 items-center justify-center rounded-full bg-secondary text-foreground"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4 no-scrollbar">
          {lines.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <div className="flex size-16 items-center justify-center rounded-full bg-secondary">
                <ShoppingBag className="size-7 text-muted-foreground" />
              </div>
              <p className="text-lg font-bold text-foreground">Your order is empty</p>
              <p className="max-w-[240px] text-sm text-muted-foreground">
                Scroll the menu and tap “Add to order” to start building your meal.
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {lines.map((line) => (
                <li key={line.dish.id} className="flex gap-3 rounded-2xl bg-secondary p-3">
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl">
                    <Image src={line.dish.image || "/placeholder.svg"} alt={line.dish.name} fill className="object-cover" sizes="64px" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold leading-tight text-foreground">{line.dish.name}</p>
                        <p className="text-sm text-muted-foreground">${line.dish.price.toFixed(2)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(line.dish.id)}
                        aria-label={`Remove ${line.dish.name}`}
                        className="text-muted-foreground transition-colors hover:text-primary"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onDec(line.dish.id)}
                          aria-label={`Decrease ${line.dish.name}`}
                          className="flex size-7 items-center justify-center rounded-full bg-card text-foreground"
                        >
                          <Minus className="size-4" />
                        </button>
                        <span className="w-5 text-center text-sm font-bold text-foreground">{line.qty}</span>
                        <button
                          type="button"
                          onClick={() => onInc(line.dish.id)}
                          aria-label={`Increase ${line.dish.name}`}
                          className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground"
                        >
                          <Plus className="size-4" />
                        </button>
                      </div>
                      <span className="font-bold text-foreground">${(line.dish.price * line.qty).toFixed(2)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 ? (
          <footer className="border-t border-border px-5 py-4">
            <div className="mb-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Tax (8%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 text-base font-bold text-foreground">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <button
              type="button"
              className="w-full rounded-full bg-primary py-4 text-base font-bold text-primary-foreground transition-transform active:scale-[0.99]"
            >
              Checkout · {itemCount} {itemCount === 1 ? "item" : "items"}
            </button>
          </footer>
        ) : null}
      </div>
    </div>
  )
}
