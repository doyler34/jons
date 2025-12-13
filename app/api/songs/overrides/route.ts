import { sql } from "@vercel/postgres"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Check admin auth
async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  return !!session?.value
}

// Ensure table exists
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS song_overrides (
      id SERIAL PRIMARY KEY,
      spotify_id VARCHAR(255) UNIQUE NOT NULL,
      audio_url TEXT,
      cover_url TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
}

// GET - Fetch all song overrides
export async function GET() {
  try {
    await ensureTable()
    
    const result = await sql`
      SELECT spotify_id, audio_url, cover_url, updated_at 
      FROM song_overrides
    `

    // Convert to a map for easy lookup
    const overrides: Record<string, { audio_url: string | null; cover_url: string | null }> = {}
    for (const row of result.rows) {
      overrides[row.spotify_id] = {
        audio_url: row.audio_url,
        cover_url: row.cover_url,
      }
    }

    return NextResponse.json({ overrides })
  } catch (error) {
    console.error("Failed to fetch overrides:", error)
    return NextResponse.json({ overrides: {} })
  }
}

// POST - Create or update a song override
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await ensureTable()
    
    const body = await request.json()
    const { spotify_id, audio_url, cover_url } = body

    if (!spotify_id) {
      return NextResponse.json({ error: "spotify_id is required" }, { status: 400 })
    }

    // Upsert - insert or update if exists
    await sql`
      INSERT INTO song_overrides (spotify_id, audio_url, cover_url, updated_at)
      VALUES (${spotify_id}, ${audio_url || null}, ${cover_url || null}, NOW())
      ON CONFLICT (spotify_id) 
      DO UPDATE SET 
        audio_url = COALESCE(${audio_url}, song_overrides.audio_url),
        cover_url = COALESCE(${cover_url}, song_overrides.cover_url),
        updated_at = NOW()
    `

    return NextResponse.json({ success: true, message: "Override saved" })
  } catch (error) {
    console.error("Failed to save override:", error)
    return NextResponse.json(
      { error: "Failed to save override", details: String(error) },
      { status: 500 }
    )
  }
}

// DELETE - Remove an override (or specific field)
export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const spotify_id = searchParams.get("spotify_id")
    const field = searchParams.get("field") // "audio" | "cover" | null (delete entire record)

    if (!spotify_id) {
      return NextResponse.json({ error: "spotify_id is required" }, { status: 400 })
    }

    if (field === "audio") {
      await sql`
        UPDATE song_overrides 
        SET audio_url = NULL, updated_at = NOW()
        WHERE spotify_id = ${spotify_id}
      `
    } else if (field === "cover") {
      await sql`
        UPDATE song_overrides 
        SET cover_url = NULL, updated_at = NOW()
        WHERE spotify_id = ${spotify_id}
      `
    } else {
      await sql`
        DELETE FROM song_overrides 
        WHERE spotify_id = ${spotify_id}
      `
    }

    return NextResponse.json({ success: true, message: "Override removed" })
  } catch (error) {
    console.error("Failed to delete override:", error)
    return NextResponse.json(
      { error: "Failed to delete override", details: String(error) },
      { status: 500 }
    )
  }
}



