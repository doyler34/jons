import { NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

const ensureTable = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS newsletter_events (
      id SERIAL PRIMARY KEY,
      send_id INTEGER,
      event_type VARCHAR(20) NOT NULL,
      link_url TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  const target = request.nextUrl.searchParams.get("url")

  if (!target) {
    return NextResponse.json({ error: "Missing url" }, { status: 400 })
  }

  let decoded = target
  try {
    decoded = decodeURIComponent(target)
  } catch {
    decoded = target
  }

  if (!decoded.startsWith("http://") && !decoded.startsWith("https://")) {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }

  await ensureTable()

  try {
    await sql`
      INSERT INTO newsletter_events (send_id, event_type, link_url, user_agent)
      VALUES (${id ? Number(id) : null}, 'click', ${decoded}, ${request.headers.get("user-agent") || ""})
    `
  } catch (error) {
    console.error("Failed to record click event", error)
  }

  return NextResponse.redirect(decoded)
}

