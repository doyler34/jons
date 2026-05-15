import { NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import { cookies } from "next/headers"

// Disable caching so admin changes show immediately
export const dynamic = "force-dynamic"
export const revalidate = 0

async function isAuthenticated() {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  return !!session?.value
}

// GET - Fetch all manual songs
export async function GET() {
  try {
    // Create table if it doesn't exist - audio_url is now optional
    await sql`
      CREATE TABLE IF NOT EXISTS manual_songs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        album_name VARCHAR(255) DEFAULT 'Singles',
        audio_url TEXT,
        cover_url TEXT,
        release_type VARCHAR(50) DEFAULT 'single',
        duration_ms INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Alter existing table to add new columns if they don't exist
    await sql`
      DO $$ 
      BEGIN 
        ALTER TABLE manual_songs ALTER COLUMN audio_url DROP NOT NULL;
      EXCEPTION
        WHEN others THEN NULL;
      END $$;
    `
    
    await sql`
      DO $$ 
      BEGIN 
        ALTER TABLE manual_songs ADD COLUMN IF NOT EXISTS release_type VARCHAR(50) DEFAULT 'single';
        ALTER TABLE manual_songs ADD COLUMN IF NOT EXISTS duration_ms INTEGER DEFAULT 0;
      EXCEPTION
        WHEN others THEN NULL;
      END $$;
    `

    const result = await sql`
      SELECT * FROM manual_songs ORDER BY created_at DESC
    `

    const response = NextResponse.json({ songs: result.rows })
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    return response
  } catch (error) {
    console.error("Failed to fetch manual songs:", error)
    return NextResponse.json({ songs: [] })
  }
}

// POST - Create a new manual song or update existing one
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { id, title, album_name, audio_url, cover_url } = body

    // Ensure table exists - audio_url is optional
    await sql`
      CREATE TABLE IF NOT EXISTS manual_songs (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        album_name VARCHAR(255) DEFAULT 'Singles',
        audio_url TEXT,
        cover_url TEXT,
        release_type VARCHAR(50) DEFAULT 'single',
        duration_ms INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // If ID is provided, update existing song
    if (id) {
      const updates = []
      const values: any[] = []
      let paramIndex = 1

      if (audio_url !== undefined) {
        updates.push(`audio_url = $${paramIndex}`)
        values.push(audio_url)
        paramIndex++
      }
      if (cover_url !== undefined) {
        updates.push(`cover_url = $${paramIndex}`)
        values.push(cover_url)
        paramIndex++
      }
      if (title !== undefined) {
        updates.push(`title = $${paramIndex}`)
        values.push(title)
        paramIndex++
      }
      if (album_name !== undefined) {
        updates.push(`album_name = $${paramIndex}`)
        values.push(album_name)
        paramIndex++
      }
      if (body.release_type !== undefined) {
        updates.push(`release_type = $${paramIndex}`)
        values.push(body.release_type)
        paramIndex++
      }
      if (body.duration_ms !== undefined) {
        updates.push(`duration_ms = $${paramIndex}`)
        values.push(body.duration_ms)
        paramIndex++
      }

      if (updates.length === 0) {
        return NextResponse.json({ error: "No fields to update" }, { status: 400 })
      }

      values.push(id)
      const query = `UPDATE manual_songs SET ${updates.join(", ")} WHERE id = $${paramIndex} RETURNING *`
      
      const result = await sql.query(query, values)
      return NextResponse.json({ success: true, song: result.rows[0] })
    }

    // Otherwise, create new song
    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO manual_songs (title, album_name, audio_url, cover_url, release_type, duration_ms)
      VALUES (${title}, ${album_name || 'Singles'}, ${audio_url}, ${cover_url || null}, ${body.release_type || 'single'}, ${body.duration_ms || 0})
      RETURNING *
    `

    return NextResponse.json({ success: true, song: result.rows[0] })
  } catch (error) {
    console.error("Failed to create/update manual song:", error)
    return NextResponse.json(
      { error: "Failed to create/update song", details: String(error) },
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

