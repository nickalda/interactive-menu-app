"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type CategoryOption = { id: number; categoryName: string }

type AdminDish = {
  id: number
  name: string | null
  tagline: string | null
  category: number | null
  price: number | null
  calories: number | null
  prep_time: number | null
  spicy: number | null
  rating: number | null
  image: string | null
  description: string | null
  ingredients: string | null
  allergens: string | null
  likes: number | null
}

type DishFormState = {
  id: number | null
  name: string
  tagline: string
  category: string
  price: string
  calories: string
  prep_time: string
  spicy: string
  rating: string
  image: string
  description: string
  ingredients: string
  allergens: string
  likes: string
}

const EMPTY_FORM: DishFormState = {
  id: null,
  name: "",
  tagline: "",
  category: "",
  price: "",
  calories: "",
  prep_time: "",
  spicy: "0",
  rating: "",
  image: "",
  description: "",
  ingredients: "",
  allergens: "",
  likes: "0",
}

function parseStringArray(value: string | null): string[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === "string")
  } catch {
    // not JSON, fall through to comma-splitting
  }
  return value.split(",").map((item) => item.trim()).filter(Boolean)
}

function dishToFormState(dish: AdminDish): DishFormState {
  return {
    id: dish.id,
    name: dish.name ?? "",
    tagline: dish.tagline ?? "",
    category: dish.category !== null ? String(dish.category) : "",
    price: dish.price !== null ? String(dish.price) : "",
    calories: dish.calories !== null ? String(dish.calories) : "",
    prep_time: dish.prep_time !== null ? String(dish.prep_time) : "",
    spicy: dish.spicy !== null ? String(dish.spicy) : "0",
    rating: dish.rating !== null ? String(dish.rating) : "",
    image: dish.image ?? "",
    description: dish.description ?? "",
    ingredients: parseStringArray(dish.ingredients).join(", "),
    allergens: parseStringArray(dish.allergens).join(", "),
    likes: dish.likes !== null ? String(dish.likes) : "0",
  }
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
const labelClass = "text-xs font-medium uppercase tracking-wide text-muted-foreground"

export function AdminApp() {
  const [authChecked, setAuthChecked] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState("")
  const [loginError, setLoginError] = useState<string | null>(null)
  const [loginLoading, setLoginLoading] = useState(false)

  const [dishes, setDishes] = useState<AdminDish[]>([])
  const [categories, setCategories] = useState<CategoryOption[]>([])
  const [loadingMenu, setLoadingMenu] = useState(false)
  const [menuError, setMenuError] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [form, setForm] = useState<DishFormState>(EMPTY_FORM)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  const checkSession = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/session")
      const data = (await res.json()) as { authenticated: boolean }
      setAuthenticated(Boolean(data.authenticated))
    } catch {
      setAuthenticated(false)
    } finally {
      setAuthChecked(true)
    }
  }, [])

  useEffect(() => {
    void checkSession()
  }, [checkSession])

  const loadMenu = useCallback(async () => {
    setLoadingMenu(true)
    setMenuError(null)
    try {
      const res = await fetch("/api/admin/menu")
      const data = (await res.json()) as { menu?: AdminDish[]; categories?: CategoryOption[]; error?: string }

      if (!res.ok || data.error) {
        setMenuError(data.error ?? `Failed to load menu (status ${res.status})`)
        return
      }

      setDishes(data.menu ?? [])
      setCategories(data.categories ?? [])
    } catch (err) {
      setMenuError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoadingMenu(false)
    }
  }, [])

  useEffect(() => {
    if (authenticated) void loadMenu()
  }, [authenticated, loadMenu])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError(null)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok) {
        setLoginError(data.error ?? "Login failed")
        return
      }
      setPassword("")
      setAuthenticated(true)
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoginLoading(false)
    }
  }

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" })
    setAuthenticated(false)
    setDishes([])
  }

  function openCreateForm() {
    setForm(EMPTY_FORM)
    setImageFile(null)
    setImagePreview(null)
    setSaveError(null)
    setFormOpen(true)
  }

  function openEditForm(dish: AdminDish) {
    setForm(dishToFormState(dish))
    setImageFile(null)
    setImagePreview(dish.image ?? null)
    setSaveError(null)
    setFormOpen(true)
  }

  function closeForm() {
    setFormOpen(false)
    setImageFile(null)
    setImagePreview(null)
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    if (file) {
      setImagePreview(URL.createObjectURL(file))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaveError(null)

    try {
      let imageUrl = form.image

      if (imageFile) {
        const uploadData = new FormData()
        uploadData.append("file", imageFile)
        const uploadRes = await fetch("/api/admin/upload", { method: "POST", body: uploadData })
        const uploadJson = (await uploadRes.json()) as { url?: string; error?: string }
        if (!uploadRes.ok || uploadJson.error) {
          throw new Error(uploadJson.error ?? "Image upload failed")
        }
        imageUrl = uploadJson.url ?? imageUrl
      }

      const payload = {
        id: form.id ?? undefined,
        name: form.name,
        tagline: form.tagline,
        category: form.category,
        price: Number(form.price || 0),
        calories: Number(form.calories || 0),
        prep_time: Number(form.prep_time || 0),
        spicy: Number(form.spicy || 0),
        rating: Number(form.rating || 0),
        image: imageUrl,
        description: form.description,
        ingredients: form.ingredients,
        allergens: form.allergens,
        likes: Number(form.likes || 0),
      }

      const res = await fetch("/api/admin/menu", {
        method: form.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = (await res.json()) as { error?: string }
      if (!res.ok || data.error) {
        throw new Error(data.error ?? "Failed to save dish")
      }

      closeForm()
      await loadMenu()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!window.confirm("Delete this dish permanently? This cannot be undone.")) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/admin/menu?id=${id}`, { method: "DELETE" })
      const data = (await res.json()) as { error?: string }
      if (!res.ok || data.error) {
        throw new Error(data.error ?? "Failed to delete dish")
      }
      setDishes((prev) => prev.filter((dish) => dish.id !== id))
    } catch (err) {
      setMenuError(err instanceof Error ? err.message : String(err))
    } finally {
      setDeletingId(null)
    }
  }

  const categoryLookup = useMemo(() => {
    const map = new Map<number, string>()
    categories.forEach((cat) => map.set(cat.id, cat.categoryName))
    return map
  }, [categories])

  if (!authChecked) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4 text-foreground">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-sm"
        >
          <h1 className="font-serif text-2xl">Admin sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">Enter the admin password to manage the menu.</p>

          <div className="mt-5 flex flex-col gap-1.5">
            <label className={labelClass} htmlFor="admin-password">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              className={inputClass}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
              required
            />
          </div>

          {loginError ? <p className="mt-3 text-sm text-destructive">{loginError}</p> : null}

          <Button type="submit" className="mt-5 w-full" disabled={loginLoading}>
            {loginLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-4 backdrop-blur sm:px-8">
        <div>
          <h1 className="font-serif text-2xl">Menu admin</h1>
          <p className="text-sm text-muted-foreground">Add, edit, delete dishes and upload photos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={openCreateForm}>
            + Add dish
          </Button>
          <Button variant="ghost" onClick={handleLogout}>
            Log out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-8">
        {menuError ? (
          <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {menuError}
          </div>
        ) : null}

        {loadingMenu ? (
          <p className="text-sm text-muted-foreground">Loading menu...</p>
        ) : dishes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No dishes yet. Click &quot;Add dish&quot; to create one.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {dishes.map((dish) => (
              <div key={dish.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="relative h-36 w-full bg-muted">
                  {dish.image ? (
                    <Image src={dish.image} alt={dish.name ?? "Dish"} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                </div>
                <div className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-tight">{dish.name || "Untitled dish"}</p>
                    <span className="shrink-0 text-sm font-semibold text-primary">
                      ${(dish.price ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {dish.category !== null ? categoryLookup.get(dish.category) ?? "Uncategorized" : "Uncategorized"}
                  </p>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => openEditForm(dish)}>
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="flex-1"
                      disabled={deletingId === dish.id}
                      onClick={() => handleDelete(dish.id)}
                    >
                      {deletingId === dish.id ? "Deleting..." : "Delete"}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {formOpen ? (
        <div className="fixed inset-0 z-20 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-8">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">{form.id ? "Edit dish" : "Add dish"}</h2>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-full p-1 text-muted-foreground hover:bg-muted"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Name</label>
                <input
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Tagline</label>
                <input
                  className={inputClass}
                  value={form.tagline}
                  onChange={(e) => setForm((f) => ({ ...f, tagline: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Category</label>
                <select
                  className={inputClass}
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  <option value="">Uncategorized</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.categoryName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className={inputClass}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Calories</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={form.calories}
                  onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Prep time (minutes)</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={form.prep_time}
                  onChange={(e) => setForm((f) => ({ ...f, prep_time: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Spicy level (0-3)</label>
                <input
                  type="number"
                  min="0"
                  max="3"
                  className={inputClass}
                  value={form.spicy}
                  onChange={(e) => setForm((f) => ({ ...f, spicy: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Rating (0-5)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="5"
                  className={inputClass}
                  value={form.rating}
                  onChange={(e) => setForm((f) => ({ ...f, rating: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className={labelClass}>Likes</label>
                <input
                  type="number"
                  min="0"
                  className={inputClass}
                  value={form.likes}
                  onChange={(e) => setForm((f) => ({ ...f, likes: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={labelClass}>Description</label>
                <textarea
                  className={cn(inputClass, "min-h-20 resize-y")}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={labelClass}>Ingredients (comma-separated)</label>
                <input
                  className={inputClass}
                  value={form.ingredients}
                  onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))}
                  placeholder="Beef patty, Cheese, Brioche bun"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={labelClass}>Allergens (comma-separated)</label>
                <input
                  className={inputClass}
                  value={form.allergens}
                  onChange={(e) => setForm((f) => ({ ...f, allergens: e.target.value }))}
                  placeholder="Gluten, Dairy, Egg"
                />
              </div>

              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <label className={labelClass}>Photo</label>
                <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleImageChange} />
                {imagePreview ? (
                  <div className="relative mt-2 h-40 w-full overflow-hidden rounded-lg border border-border bg-muted">
                    <Image src={imagePreview} alt="Preview" fill className="object-cover" unoptimized />
                  </div>
                ) : null}
              </div>
            </div>

            {saveError ? <p className="mt-4 text-sm text-destructive">{saveError}</p> : null}

            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : form.id ? "Save changes" : "Create dish"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  )
}
