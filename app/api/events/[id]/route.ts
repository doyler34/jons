import { sql } from "@vercel/postgres"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// Check admin auth
async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  return !!session?.value
}

// GET - Fetch single event
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const result = await sql`
      SELECT * FROM events WHERE id = ${id}
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ event: result.rows[0] })
  } catch (error) {
    console.error("Failed to fetch event:", error)
    return NextResponse.json({ error: "Failed to fetch event" }, { status: 500 })
  }
}

// PUT - Update event
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const { title, venue, city, date, time, ticket_url, description, image_url, is_past } = body

    if (!title || !venue || !city || !date) {
      return NextResponse.json(
        { error: "Title, venue, city, and date are required" },
        { status: 400 }
      )
    }

    const result = await sql`
      UPDATE events 
      SET 
        title = ${title},
        venue = ${venue},
        city = ${city},
        date = ${date},
        time = ${time || null},
        ticket_url = ${ticket_url || null},
        description = ${description || null},
        image_url = ${image_url || null},
        is_past = ${is_past || false},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, event: result.rows[0] })
  } catch (error) {
    console.error("Failed to update event:", error)
    return NextResponse.json(
      { error: "Failed to update event", details: String(error) },
      { status: 500 }
    )
  }
}

// DELETE - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { id } = await params
    
    const result = await sql`
      DELETE FROM events WHERE id = ${id} RETURNING id
    `

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete event:", error)
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    )
  }
}

