import { sql } from "@vercel/postgres"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Disable caching
export const dynamic = "force-dynamic"
export const revalidate = 0

// Check admin auth
async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  return !!session?.value
}

// Ensure table exists
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key VARCHAR(255) PRIMARY KEY,
      value TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
}

// Default settings
const DEFAULT_SETTINGS: Record<string, string> = {
  // Social Links
  instagram_url: "https://instagram.com/jonspirit",
  twitter_url: "https://twitter.com/jonspirit",
  tiktok_url: "https://tiktok.com/@jonspirit",
  youtube_url: "https://youtube.com/@jonspirit",
  
  // Streaming Links
  spotify_url: "https://open.spotify.com/artist/jonspirit",
  apple_music_url: "https://music.apple.com/artist/jonspirit",
  soundcloud_url: "https://soundcloud.com/jonspirit",
  
  // SEO
  site_title: "Jon Spirit - Official Website",
  site_description: "Official website of Jon Spirit. Listen to the latest music, find upcoming shows, and more.",
  
  // Contact
  contact_email: "contact@jonspirit.com",
}

// GET - Fetch all settings
export async function GET() {
  try {
    await ensureTable()
    
    const result = await sql`SELECT key, value FROM site_settings`
    
    // Start with defaults, override with stored values
    const settings = { ...DEFAULT_SETTINGS }
    for (const row of result.rows) {
      settings[row.key] = row.value
    }

    const response = NextResponse.json({ settings })
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    return response
  } catch (error) {
    console.error("Failed to fetch settings:", error)
    return NextResponse.json({ settings: DEFAULT_SETTINGS })
  }
}

// POST - Update settings (admin only)
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await ensureTable()
    
    const body = await request.json()
    const { settings } = body

    if (!settings || typeof settings !== "object") {
      return NextResponse.json(
        { error: "Settings object is required" },
        { status: 400 }
      )
    }

    // Upsert each setting
    for (const [key, value] of Object.entries(settings)) {
      if (typeof value === "string") {
        await sql`
          INSERT INTO site_settings (key, value, updated_at)
          VALUES (${key}, ${value}, NOW())
          ON CONFLICT (key) DO UPDATE SET value = ${value}, updated_at = NOW()
        `
      }
    }

    return NextResponse.json({ success: true, message: "Settings updated" })
  } catch (error) {
    console.error("Failed to update settings:", error)
    return NextResponse.json(
      { error: "Failed to update settings", details: String(error) },
      { status: 500 }
    )
  }
}

