import { NextResponse } from 'next/server'
import { randomUUID } from 'node:crypto'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin, AdminAuthError } from '@/lib/admin-auth'

export const runtime = 'nodejs'

const BUCKET = 'dish-images'
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB, matches the bucket's file_size_limit

function handleError(err: unknown) {
  if (err instanceof AdminAuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status })
  }
  return NextResponse.json(
    { error: err instanceof Error ? err.message : String(err) },
    { status: 500 },
  )
}

export async function POST(request: Request) {
  try {
    await requireAdmin()

    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file was uploaded' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type "${file.type}". Use PNG, JPEG, WEBP, or GIF.` },
        { status: 400 },
      )
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'File is larger than 5MB' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const extension = file.name.split('.').pop() ?? 'jpg'
    const safeName = `${Date.now()}-${randomUUID()}.${extension}`
    const path = `dishes/${safeName}`

    const arrayBuffer = await file.arrayBuffer()
    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
      contentType: file.type,
      upsert: false,
    })

    if (uploadError) throw new Error(uploadError.message)

    const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(path)

    return NextResponse.json({ url: publicUrlData.publicUrl, path }, { status: 201 })
  } catch (err) {
    return handleError(err)
  }
}
