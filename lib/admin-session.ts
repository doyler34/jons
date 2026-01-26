export function verifyAdminSessionToken(token: string | undefined, secret: string): boolean {
  if (!token || !secret) return false
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8")
    const [tsStr, secretPart] = decoded.split("-", 2)
    const ts = Number(tsStr)
    const now = Date.now()

    // basic secret check
    if (!secretPart || !decoded.includes(secret)) return false

    // optional freshness check: 24h window
    if (Number.isFinite(ts) && ts > 0) {
      const maxAgeMs = 24 * 60 * 60 * 1000
      if (now - ts > maxAgeMs) return false
    }

    return true
  } catch {
    return false
  }
}
