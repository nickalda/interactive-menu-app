import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const runtime = 'nodejs'

type RawDish = Record<string, unknown>
type CategoryOption = { label: string; value: string }

const normalizeStringArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string')
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string')
      }
    } catch {
      // not JSON
    }
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }

  return []
}

const normalizeMenuItem = (dish: RawDish, categoryLookup: Map<string, string>) => {
  const rawCategory = dish.category
  const categoryValue = typeof rawCategory === 'string' || typeof rawCategory === 'number' ? String(rawCategory) : ''
  const resolvedCategory = categoryLookup.get(categoryValue) ?? (typeof rawCategory === 'string' ? rawCategory : String(rawCategory ?? ''))

  return {
    ...dish,
    category: resolvedCategory,
    categoryValue,
    ingredients: normalizeStringArray(dish.ingredients),
    allergens: normalizeStringArray(dish.allergens),
    prepTime: typeof dish.prep_time === 'string' ? dish.prep_time : dish.prepTime ?? '',
  }
}

export async function GET() {
  try {
    const [menuResponse, categoryResponse] = await Promise.all([
      supabase
        .from('menu')
        .select(
          `id, name, tagline, category, price, calories, prep_time, spicy, rating, image, description, ingredients, allergens, likes`,
        ),
      supabase.from('REF_category').select('id, categoryName'),
    ])

    const { data: menuData, error: menuError } = menuResponse
    const { data: categoryData, error: categoryError } = categoryResponse

    if (menuError || categoryError) {
      return NextResponse.json(
        { error: (menuError ?? categoryError)?.message ?? 'Unable to fetch menu or categories' },
        { status: 500 },
      )
    }

    const categoryLookup = new Map<string, string>()
    const categories: CategoryOption[] = []

    ;(Array.isArray(categoryData) ? categoryData : []).forEach((category) => {
      const label = typeof category?.categoryName === 'string' ? category.categoryName.trim() : ''
      const value = typeof category?.id === 'string' || typeof category?.id === 'number' ? String(category.id) : ''

      if (!label || !value) return

      categoryLookup.set(value, label)
      categories.push({ label, value })
    })

    const normalizedMenu = (menuData ?? []).map((dish) => normalizeMenuItem(dish, categoryLookup))
    const noData = normalizedMenu.length === 0 && categories.length === 0

    if (noData) {
      console.warn(
        'Supabase returned zero rows for both menu and categories. Confirm tables contain data and anon SELECT policies allow access.',
      )
    }

    const payload = {
      menu: normalizedMenu,
      categories,
      ...(noData
        ? {
            warning:
              'No rows returned from Supabase. Check that your tables contain data and that RLS policies allow anon SELECT access.',
          }
        : {}),
    }

    return NextResponse.json(payload)
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : String(err),
        details: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
          supabaseKeyPresent: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
        },
      },
      { status: 500 },
    )
  }
}
