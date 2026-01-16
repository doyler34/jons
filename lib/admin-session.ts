import { createHmac, timingSafeEqual } from "crypto"

type SessionPayload = {
  iat: number
  exp: number
}

const ADMIN_SESSION_TTL_SECONDS = 60 * 60 * 8 // 8 hours

function base64UrlEncode(input: string | Buffer) {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
}

function base64UrlDecodeToString(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/")
  const pad = normalized.length % 4 ? "=".repeat(4 - (normalized.length % 4)) : ""
  return Buffer.from(normalized + pad, "base64").toString("utf8")
}

function sign(payloadB64: string, secret: string) {
  return base64UrlEncode(createHmac("sha256", secret).update(payloadB64).digest())
}

export function createAdminSessionToken(secret: string, now = Date.now()) {
  const iat = Math.floor(now / 1000)
  const payload: SessionPayload = { iat, exp: iat + ADMIN_SESSION_TTL_SECONDS }
  const payloadB64 = base64UrlEncode(JSON.stringify(payload))
  const sig = sign(payloadB64, secret)
  return `${payloadB64}.${sig}`
}

export function verifyAdminSessionToken(token: string | undefined, secret: string, now = Date.now()) {
  if (!token) return false
  const parts = token.split(".")
  if (parts.length !== 2) return false
  const [payloadB64, sigB64] = parts
  if (!payloadB64 || !sigB64) return false

  const expected = sign(payloadB64, secret)
  try {
    const a = Buffer.from(sigB64)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    if (!timingSafeEqual(a, b)) return false
  } catch {
    return false
  }

  try {
    const payloadJson = base64UrlDecodeToString(payloadB64)
    const payload = JSON.parse(payloadJson) as SessionPayload
    if (!payload?.exp || typeof payload.exp !== "number") return false
    const nowSec = Math.floor(now / 1000)
    return nowSec < payload.exp
  } catch {
    return false
  }
}

export function getAdminSessionMaxAgeSeconds() {
  return ADMIN_SESSION_TTL_SECONDS
}

