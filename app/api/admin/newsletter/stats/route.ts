import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@vercel/postgres"

const ensureTables = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS newsletter_sends (
      id SERIAL PRIMARY KEY,
      subject TEXT NOT NULL,
      type VARCHAR(20) NOT NULL,
      body_html TEXT,
      poster_url TEXT,
      poster_text TEXT,
      button_text TEXT,
      button_link TEXT,
      status VARCHAR(20) DEFAULT 'scheduled',
      scheduled_at TIMESTAMPTZ,
      sent_at TIMESTAMPTZ,
      error TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  await sql`ALTER TABLE newsletter_sends ADD COLUMN IF NOT EXISTS campaign_id TEXT`

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
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  await ensureTables()

  try {
    const result = await sql`
      SELECT 
        s.id,
        s.subject,
        s.status,
        s.sent_at,
        s.scheduled_at,
        s.created_at,
        COALESCE(open_counts.open_count, 0) AS open_count,
        COALESCE(click_counts.click_count, 0) AS click_count
      FROM newsletter_sends s
      LEFT JOIN (
        SELECT send_id, COUNT(*) AS open_count
        FROM newsletter_events
        WHERE event_type = 'open'
        GROUP BY send_id
      ) AS open_counts ON open_counts.send_id = s.id
      LEFT JOIN (
        SELECT send_id, COUNT(*) AS click_count
        FROM newsletter_events
        WHERE event_type = 'click'
        GROUP BY send_id
      ) AS click_counts ON click_counts.send_id = s.id
      ORDER BY COALESCE(s.sent_at, s.scheduled_at, s.created_at) DESC
      LIMIT 25
    `

    return NextResponse.json({ stats: result.rows })
  } catch (error) {
    console.error("Failed to fetch newsletter stats", error)
    return NextResponse.json({ stats: [] })
  }
}

