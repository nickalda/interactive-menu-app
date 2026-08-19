import { request as httpsRequest } from 'node:https'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const allowInsecureTls = process.env.SUPABASE_TLS_INSECURE === 'true' || process.env.NODE_ENV === 'development'

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL and either NEXT_PUBLIC_SUPABASE_ANON_KEY or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')
}

type SupportedBody = BodyInit | null | undefined

const toNodeHeaders = (headers: Headers) => Object.fromEntries(headers.entries())

const readRequestBody = async (body: SupportedBody) => {
  if (!body) return undefined
  if (typeof body === 'string') return body
  if (body instanceof URLSearchParams) return body.toString()
  if (body instanceof ArrayBuffer) return Buffer.from(body)
  if (ArrayBuffer.isView(body)) return Buffer.from(body.buffer, body.byteOffset, body.byteLength)

  throw new TypeError('Unsupported request body type for server-side Supabase transport')
}

const createServerFetch =
  (rejectUnauthorized: boolean): typeof fetch =>
  async (input, init) => {
  const request = input instanceof Request ? input : new Request(input, init)
  const url = new URL(request.url)
  const body = await readRequestBody(request.body ? await request.arrayBuffer() : init?.body)

  return new Promise<Response>((resolve, reject) => {
    const client = httpsRequest(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port || undefined,
        path: `${url.pathname}${url.search}`,
        method: request.method,
        headers: toNodeHeaders(request.headers),
        rejectUnauthorized,
      },
      (response) => {
        const chunks: Buffer[] = []

        response.on('data', (chunk) => {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
        })

        response.on('end', () => {
          resolve(
            new Response(Buffer.concat(chunks), {
              status: response.statusCode ?? 500,
              statusText: response.statusMessage ?? '',
              headers: response.headers as HeadersInit,
            }),
          )
        })
      },
    )

    client.on('error', reject)

    if (body) {
      client.write(body)
    }

    client.end()
  })
}

const strictServerFetch = createServerFetch(true)
const insecureServerFetch = createServerFetch(false)

const serverFetch: typeof fetch = async (input, init) => {
  try {
    return await strictServerFetch(input, init)
  } catch (error) {
    const isCertificateError =
      error instanceof Error && /unable to get local issuer certificate|self-signed certificate/i.test(error.message)

    if (allowInsecureTls && isCertificateError) {
      return insecureServerFetch(input, init)
    }

    throw error
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
  global: typeof window === 'undefined' ? { fetch: serverFetch } : undefined,
})
