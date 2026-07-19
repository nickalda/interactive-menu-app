import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

type RawDish = Record<string, unknown>

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

const normalizeMenuItem = (dish: RawDish) => ({
  ...dish,
  ingredients: normalizeStringArray(dish.ingredients),
  allergens: normalizeStringArray(dish.allergens),
  prepTime: typeof dish.prep_time === 'string' ? dish.prep_time : dish.prepTime ?? '',
})

export async function GET() {
  const [menuResponse, categoryResponse] = await Promise.all([
    supabase
      .from('menu')
      .select(
        `id, name, tagline, category, price, calories, prep_time, spicy, rating, image, description, ingredients, allergens, likes`,
      ),
    supabase.from('REF_category').select('categoryName'),
  ])

  const { data: menuData, error: menuError } = menuResponse
  const { data: categoryData, error: categoryError } = categoryResponse

  if (menuError || categoryError) {
    return NextResponse.json(
      { error: (menuError ?? categoryError)?.message ?? 'Unable to fetch menu or categories' },
      { status: 500 },
    )
  }

  const categories = categoryData?.map((category) => category.categoryName).filter(Boolean) ?? []
  const normalizedMenu = (menuData ?? []).map(normalizeMenuItem)
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
}
