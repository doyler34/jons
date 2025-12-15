import { NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

const ONE_BY_ONE_GIF = Buffer.from("R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==", "base64")

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

  if (!id) {
    return new NextResponse(ONE_BY_ONE_GIF, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        Expires: "0",
      },
    })
  }

  await ensureTable()

  try {
    await sql`
      INSERT INTO newsletter_events (send_id, event_type, user_agent)
      VALUES (${Number(id)}, 'open', ${request.headers.get("user-agent") || ""})
    `
  } catch (error) {
    console.error("Failed to record open event", error)
  }

  return new NextResponse(ONE_BY_ONE_GIF, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
      Expires: "0",
    },
  })
}

