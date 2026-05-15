import { NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"
export const revalidate = 0

async function isAuthenticated() {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  return !!session?.value
}

// GET - Fetch all manual albums
export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS manual_albums (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        cover_url TEXT,
        release_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    const result = await sql`
      SELECT * FROM manual_albums ORDER BY created_at DESC
    `

    const response = NextResponse.json({ albums: result.rows })
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    return response
  } catch (error) {
    console.error("Failed to fetch manual albums:", error)
    return NextResponse.json({ albums: [] })
  }
}

// POST - Create a new album
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { name, cover_url, release_date } = body

    if (!name) {
      return NextResponse.json({ error: "Album name is required" }, { status: 400 })
    }

    await sql`
      CREATE TABLE IF NOT EXISTS manual_albums (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        cover_url TEXT,
        release_date DATE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    const result = await sql`
      INSERT INTO manual_albums (name, cover_url, release_date)
      VALUES (${name}, ${cover_url || null}, ${release_date || null})
      RETURNING *
    `

    return NextResponse.json({ success: true, album: result.rows[0] })
  } catch (error: any) {
    if (error?.code === '23505') {
      return NextResponse.json({ error: "An album with this name already exists" }, { status: 400 })
    }
    console.error("Failed to create album:", error)
    return NextResponse.json({ error: "Failed to create album" }, { status: 500 })
  }
}

// DELETE - Remove an album
export async function DELETE(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Album ID is required" }, { status: 400 })
    }

    await sql`DELETE FROM manual_albums WHERE id = ${id}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete album:", error)
    return NextResponse.json({ error: "Failed to delete album" }, { status: 500 })
  }
}
