import { NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import { cookies } from "next/headers"

async function isAuthenticated() {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  return !!session?.value
}

// GET - Fetch all manual songs
export async function GET() {
  try {
    // Create table if it doesn't exist
    await sql`
      CREATE TABLE IF NOT EXISTS manual_songs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        album_name VARCHAR(255) DEFAULT 'Singles',
        audio_url TEXT NOT NULL,
        cover_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    const result = await sql`
      SELECT * FROM manual_songs ORDER BY created_at DESC
    `

    return NextResponse.json({ songs: result.rows })
  } catch (error) {
    console.error("Failed to fetch manual songs:", error)
    return NextResponse.json({ songs: [] })
  }
}

// POST - Create a new manual song
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { title, album_name, audio_url, cover_url } = body

    if (!title || !audio_url) {
      return NextResponse.json({ error: "Title and audio_url are required" }, { status: 400 })
    }

    // Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS manual_songs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        album_name VARCHAR(255) DEFAULT 'Singles',
        audio_url TEXT NOT NULL,
        cover_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    const result = await sql`
      INSERT INTO manual_songs (title, album_name, audio_url, cover_url)
      VALUES (${title}, ${album_name || 'Singles'}, ${audio_url}, ${cover_url || null})
      RETURNING *
    `

    return NextResponse.json({ success: true, song: result.rows[0] })
  } catch (error) {
    console.error("Failed to create manual song:", error)
    return NextResponse.json(
      { error: "Failed to create song", details: String(error) },
      { status: 500 }
    )
  }
}

// DELETE - Remove a manual song
export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Song ID is required" }, { status: 400 })
    }

    await sql`DELETE FROM manual_songs WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete manual song:", error)
    return NextResponse.json(
      { error: "Failed to delete song" },
      { status: 500 }
    )
  }
}

