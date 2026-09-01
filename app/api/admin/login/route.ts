import { NextResponse } from 'next/server'
import { checkAdminPassword, createSessionToken, ADMIN_SESSION_COOKIE } from '@/lib/admin-auth'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  try {
    const { password } = (await request.json()) as { password?: string }

    if (typeof password !== 'string' || password.length === 0) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    if (!checkAdminPassword(password)) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
    }

    const { token, maxAgeSeconds } = createSessionToken()
    const response = NextResponse.json({ ok: true })
    response.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: maxAgeSeconds,
    })

    return response
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
