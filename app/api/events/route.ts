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
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      venue VARCHAR(255) NOT NULL,
      city VARCHAR(255) NOT NULL,
      date DATE NOT NULL,
      time VARCHAR(50),
      ticket_url TEXT,
      description TEXT,
      image_url TEXT,
      is_past BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
}

function normalizeDateInput(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  let s = raw.trim()
  if (!s) return null

  // ISO string -> YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return s.slice(0, 10)

  // Sometimes we get "+202501-01-24" or "202501-01-24" (year+month duplicated)
  if (/^\+\d{6}-\d{2}-\d{2}$/.test(s)) s = s.slice(1)
  if (/^\d{6}-\d{2}-\d{2}$/.test(s)) {
    const year = s.slice(0, 4)
    const month = s.slice(4, 6)
    const day = s.slice(10, 12)
    return `${year}-${month}-${day}`
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s

  const d = new Date(s)
  if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10)
  return null
}

// GET - Fetch all events
export async function GET() {
  try {
    await ensureTable()
    
    // Get all events sorted by date ascending
    const result = await sql`
      SELECT * FROM events 
      ORDER BY date ASC
    `

    const response = NextResponse.json({ events: result.rows })
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0")
    return response
  } catch (error) {
    console.error("Failed to fetch events:", error)
    return NextResponse.json({ events: [] })
  }
}

// POST - Create new event
export async function POST(request: NextRequest) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await ensureTable()
    
    const body = await request.json()
    const { title, venue, city, date, time, ticket_url, description, image_url, is_past } = body

    const normalizedDate = normalizeDateInput(date)
    if (!title || !venue || !city || !normalizedDate) {
      return NextResponse.json(
        { error: "Title, venue, city, and date are required" },
        { status: 400 }
      )
    }

    const result = await sql`
      INSERT INTO events (title, venue, city, date, time, ticket_url, description, image_url, is_past)
      VALUES (
        ${title}, 
        ${venue}, 
        ${city}, 
        ${normalizedDate}, 
        ${time || null}, 
        ${ticket_url || null}, 
        ${description || null}, 
        ${image_url || null},
        ${is_past || false}
      )
      RETURNING *
    `

    return NextResponse.json({ success: true, event: result.rows[0] })
  } catch (error) {
    console.error("Failed to create event:", error)
    return NextResponse.json(
      { error: "Failed to create event", details: String(error) },
      { status: 500 }
    )
  }
}

