// src/app/api/farcaster/webhook/route.ts
import { NextResponse } from 'next/server'
import { createHmac, timingSafeEqual } from 'crypto'
import { decodeFrameState, createNextFrameState, encodeFrameState, type FrameState } from '@/lib/farcaster/frameState'

type FrameRequest = {
  untrustedData?: {
    fid?: number
    url?: string
    messageHash?: string
    buttonIndex?: number
    inputText?: string
    state?: string
    castId?: { fid?: number; hash?: string }
  }
  trustedData?: {
    messageBytes?: string
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const raw = await request.text()
    const body = (raw ? JSON.parse(raw) : {}) as FrameRequest

    const baseUrl = process.env.NEXT_PUBLIC_URL
    if (!baseUrl) {
      return NextResponse.json({ error: 'Server not configured: NEXT_PUBLIC_URL is required' }, { status: 500 })
    }

    const isVerified = await verifyRequest(raw, request.headers, body)
    if (!isVerified.ok) {
      return NextResponse.json({ error: 'unauthorized', reason: isVerified.reason }, { status: 401 })
    }

    const { buttonIndex = 1, inputText, state: encodedState } = body.untrustedData || {}

    const currentState = safeDecodeState(encodedState)
    const contentId = currentState.contentId

    const content = contentId ? await fetchContent(baseUrl, contentId) : null
    const access = contentId ? await fetchAccess(baseUrl, contentId) : { hasAccess: false }

    const nextState = createNextFrameState(
      currentState,
      { buttonIndex, state: encodedState, userAddress: undefined, timestamp: Date.now() },
      {
        hasAccess: access.hasAccess,
        requiresPurchase: !!content && BigInt(content.payPerViewPrice || 0) > BigInt(0),
        priceUSDC: content ? formatUsdc(BigInt(content.payPerViewPrice || 0)) : undefined,
      }
    )

    const response = buildFrameJsonResponse({
      baseUrl: baseUrl.replace(/\/$/, ''),
      state: nextState,
      content: content || undefined,
    })

    return NextResponse.json(response, {
      headers: corsHeaders(),
    })
  } catch (error) {
    console.error('Farcaster webhook error', error)
    return NextResponse.json({ ok: false, error: 'internal_error' }, { status: 500, headers: corsHeaders() })
  }
}

export async function OPTIONS(): Promise<NextResponse> {
  return NextResponse.json({}, { headers: corsHeaders() })
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Warpcast-Signature, X-Farcaster-Signature',
    'Access-Control-Max-Age': '86400'
  }
}

async function verifyRequest(raw: string, headers: Headers, body: FrameRequest): Promise<{ ok: boolean; reason?: string }> {
  const secret = process.env.FARCASTER_WEBHOOK_SECRET || process.env.NEXT_PUBLIC_FARCASTER_WEBHOOK_SECRET
  const sigHeader = headers.get('x-warpcast-signature') || headers.get('x-farcaster-signature') || ''

  // Primary: HMAC verification with webhook secret (most secure)
  if (secret) {
    const ok = verifyHmacSha256(raw, sigHeader, secret)
    if (ok) return { ok: true }
    return { ok: false, reason: 'signature_mismatch' }
  }

  // Secondary: Neynar validation (if available)
  const neynarKey = process.env.NEYNAR_API_KEY
  const messageBytes = body.trustedData?.messageBytes
  if (neynarKey && messageBytes) {
    try {
      const resp = await fetch('https://api.neynar.com/v2/farcaster/frame/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api_key': neynarKey
        },
        body: JSON.stringify({ message_bytes_in_hex: messageBytes })
      })
      if (resp.ok) {
        const json = await resp.json().catch(() => null)
        if (json?.valid === true) return { ok: true }
      }
      return { ok: false, reason: 'neynar_validation_failed' }
    } catch {
      return { ok: false, reason: 'neynar_unreachable' }
    }
  }

  // Fallback: Accept requests without verification (for development/testing)
  // WARNING: This reduces security but allows the app to function without webhook secret
  console.warn('⚠️ No webhook verification method available - accepting request without signature verification')
  return { ok: true, reason: 'no_verification_available' }
}

function verifyHmacSha256(raw: string, providedSig: string, secret: string): boolean {
  if (!providedSig) return false
  const hmac = createHmac('sha256', secret).update(raw).digest()

  const normalized = providedSig.trim()
  const asHex = normalized.startsWith('0x') ? normalized.slice(2) : normalized
  try {
    const sigBytes = Buffer.from(asHex, 'hex')
    if (sigBytes.length === hmac.length && timingSafeEqual(sigBytes, hmac)) return true
  } catch {}

  try {
    const sigBase64 = Buffer.from(normalized, 'base64')
    if (sigBase64.length === hmac.length && timingSafeEqual(sigBase64, hmac)) return true
  } catch {}

  return false
}

function safeDecodeState(encoded?: string): FrameState {
  try {
    const state = decodeFrameState(encoded)
    if (!state.contentId) return { contentId: '', step: 'preview' }
    return state
  } catch {
    return { contentId: '', step: 'preview' }
  }
}

async function fetchContent(baseUrl: string, contentId: string): Promise<{
  id: string
  title: string
  description: string
  category: number
  payPerViewPrice: string | number | bigint
  creator: string
} | null> {
  try {
    const res = await fetch(`${baseUrl}/api/content/${contentId}`, { next: { revalidate: 60 } })
    if (!res.ok) return null
    const json = await res.json()
    return json?.data || json
  } catch {
    return null
  }
}

async function fetchAccess(baseUrl: string, contentId: string): Promise<{ hasAccess: boolean }> {
  try {
    const res = await fetch(`${baseUrl}/api/content/${contentId}/access`, { next: { revalidate: 60 } })
    if (!res.ok) return { hasAccess: false }
    const json = await res.json().catch(() => null)
    const hasAccess = Boolean(json?.hasAccess || json?.isPurchased || json?.subscription?.isActive)
    return { hasAccess }
  } catch {
    return { hasAccess: false }
  }
}

function formatUsdc(valueWei: bigint): string {
  if (!valueWei || valueWei === BigInt(0)) return '0'
  const whole = Number(valueWei) / 1_000_000
  return whole.toFixed(2)
}

function buildFrameJsonResponse(params: {
  baseUrl: string
  state: FrameState
  content?: {
    id: string
    title: string
    description: string
    category: number
    payPerViewPrice: string | number | bigint
    creator: string
  }
}) {
  const { baseUrl, state, content } = params
  const image = `${baseUrl}/api/og/content/${state.contentId || 'preview'}?step=${state.step}`
  const price = content ? formatUsdc(BigInt(content.payPerViewPrice || 0)) : undefined

  const buttons = (() => {
    switch (state.step) {
      case 'preview':
        return [
          {
            label: price && price !== '0' ? `Purchase - $${price}` : 'View Content',
            action: 'post' as const
          },
          content?.creator
            ? { label: 'View Creator', action: 'link' as const, target: `${baseUrl}/creator/${content.creator}` }
            : { label: 'Browse', action: 'link' as const, target: `${baseUrl}/browse` }
        ]
      case 'purchase':
        return [
          { label: '✅ Confirm Purchase', action: 'post' as const },
          { label: '← Back', action: 'post' as const }
        ]
      case 'confirmation':
        return [
          { label: '📖 Read Content', action: 'link' as const, target: `${baseUrl}/content/${state.contentId}?access=granted` },
          content
            ? { label: 'Share Success', action: 'link' as const, target: `https://warpcast.com/~/compose?text=Just purchased "${content.title}" - check it out!&embeds[]=${baseUrl}/content/${state.contentId}` }
            : { label: 'Discover More', action: 'link' as const, target: `${baseUrl}/browse` }
        ]
      case 'access':
        return [
          { label: 'Continue Reading', action: 'link' as const, target: `${baseUrl}/content/${state.contentId}` },
          { label: 'Discover More', action: 'link' as const, target: `${baseUrl}/browse` }
        ]
      case 'error':
      default:
        return [
          { label: 'Try Again', action: 'post' as const },
          { label: 'Get Help', action: 'link' as const, target: `${baseUrl}/support` }
        ]
    }
  })()

  return {
    version: 'vNext',
    image,
    imageAspectRatio: '1.91:1',
    postUrl: `${baseUrl}/api/farcaster/webhook`,
    state: encodeFrameState(state),
    buttons
  }
}

