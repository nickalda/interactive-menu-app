import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, AdminAuthError } from '@/lib/admin-auth'

export const runtime = 'nodejs'

const MENU_COLUMNS =
  'id, name, tagline, category, price, calories, prep_time, spicy, rating, image, description, ingredients, allergens, likes'

type DishPayload = {
  id?: number | string
  name?: string
  tagline?: string
  category?: number | string
  price?: number
  calories?: number
  prep_time?: number
  spicy?: number
  rating?: number
  image?: string
  description?: string
  ingredients?: string[] | string
  allergens?: string[] | string
  likes?: number
}

function toStringArrayJson(value: unknown): string {
  if (Array.isArray(value)) {
    return JSON.stringify(value.filter((item) => typeof item === 'string'))
  }
  if (typeof value === 'string') {
    return JSON.stringify(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    )
  }
  return JSON.stringify([])
}

function toDishRow(payload: DishPayload) {
  return {
    name: payload.name?.trim() ?? '',
    tagline: payload.tagline?.trim() ?? '',
    category: payload.category !== undefined && payload.category !== '' ? Number(payload.category) : null,
    price: payload.price !== undefined ? Number(payload.price) : 0,
    calories: payload.calories !== undefined ? Number(payload.calories) : 0,
    prep_time: payload.prep_time !== undefined ? Number(payload.prep_time) : 0,
    spicy: payload.spicy !== undefined ? Number(payload.spicy) : 0,
    rating: payload.rating !== undefined ? Number(payload.rating) : 0,
    image: payload.image?.trim() ?? '',
    description: payload.description?.trim() ?? '',
    ingredients: toStringArrayJson(payload.ingredients),
    allergens: toStringArrayJson(payload.allergens),
    likes: payload.likes !== undefined ? Number(payload.likes) : 0,
  }
}

function handleError(err: unknown) {
  if (err instanceof AdminAuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  return NextResponse.json(
    { error: err instanceof Error ? err.message : String(err) },
    { status: 500 },
  )
}

export async function GET() {
  try {
    await requireAdmin()
    const supabase = getSupabaseAdmin()

    const [menuResponse, categoryResponse] = await Promise.all([
      supabase.from('menu').select(MENU_COLUMNS).order('id', { ascending: true }),
      supabase.from('REF_category').select('id, categoryName').order('id', { ascending: true }),
    ])

    if (menuResponse.error) throw new Error(menuResponse.error.message)
    if (categoryResponse.error) throw new Error(categoryResponse.error.message)

    return NextResponse.json({
      menu: menuResponse.data ?? [],
      categories: categoryResponse.data ?? [],
    })
  } catch (err) {
    return handleError(err)
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin()
    const supabase = getSupabaseAdmin()
    const payload = (await request.json()) as DishPayload

    if (!payload.name?.trim()) {
      return NextResponse.json({ error: 'Dish name is required' }, { status: 400 })
    }

    const { data, error } = await supabase.from('menu').insert(toDishRow(payload)).select(MENU_COLUMNS).single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ dish: data }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin()
    const supabase = getSupabaseAdmin()
    const payload = (await request.json()) as DishPayload

    if (payload.id === undefined || payload.id === null || payload.id === '') {
      return NextResponse.json({ error: 'Dish id is required' }, { status: 400 })
    }

    if (!payload.name?.trim()) {
      return NextResponse.json({ error: 'Dish name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('menu')
      .update(toDishRow(payload))
      .eq('id', payload.id)
      .select(MENU_COLUMNS)
      .single()

    if (error) throw new Error(error.message)

    return NextResponse.json({ dish: data })
  } catch (err) {
    return handleError(err)
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin()
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Dish id is required' }, { status: 400 })
    }

    const { error } = await supabase.from('menu').delete().eq('id', id)

    if (error) throw new Error(error.message)

    return NextResponse.json({ ok: true })
  } catch (err) {
    return handleError(err)
  }
}
