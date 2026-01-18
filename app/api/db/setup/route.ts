import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAdminSessionToken } from "@/lib/admin-session"

// This endpoint creates the song_overrides table
// Run once: GET /api/db/setup (ADMIN ONLY)
export async function GET() {
  // Check authentication - admin only
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  const secret = process.env.ADMIN_PASSWORD
  const ok = !!secret && verifyAdminSessionToken(session?.value, secret)

  if (!ok) {
    return NextResponse.json({ error: "Unauthorized - Admin access only" }, { status: 401 })
  }

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS song_overrides (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        spotify_id TEXT UNIQUE NOT NULL,
        audio_url TEXT,
        cover_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create index for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_song_overrides_spotify_id 
      ON song_overrides(spotify_id)
    `

    return NextResponse.json({ 
      success: true, 
      message: "Database table created successfully" 
    })
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      { error: "Failed to create database table", details: String(error) },
      { status: 500 }
    )
  }
}








