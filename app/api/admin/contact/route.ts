import { NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import { cookies } from "next/headers"

export async function GET(request: NextRequest) {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "all"

    let query = sql`
      SELECT id, name, email, subject, message, read, replied, archived, created_at
      FROM contact_messages
    `

    if (filter === "unread") {
      query = sql`
        SELECT id, name, email, subject, message, read, replied, archived, created_at
        FROM contact_messages
        WHERE read = FALSE AND archived = FALSE
      `
    } else if (filter === "archived") {
      query = sql`
        SELECT id, name, email, subject, message, read, replied, archived, created_at
        FROM contact_messages
        WHERE archived = TRUE
      `
    } else if (filter === "all") {
      query = sql`
        SELECT id, name, email, subject, message, read, replied, archived, created_at
        FROM contact_messages
        WHERE archived = FALSE
      `
    }

    const result = await query
    const messages = result.rows

    // Get counts
    const unreadCount = await sql`
      SELECT COUNT(*) as count FROM contact_messages WHERE read = FALSE AND archived = FALSE
    `
    const totalCount = await sql`
      SELECT COUNT(*) as count FROM contact_messages WHERE archived = FALSE
    `

    return NextResponse.json({
      messages,
      unreadCount: parseInt(unreadCount.rows[0].count),
      totalCount: parseInt(totalCount.rows[0].count),
    })
  } catch (error) {
    console.error("Error fetching contact messages:", error)
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    )
  }
}

