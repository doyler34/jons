import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@vercel/postgres"

const STATUS_SCHEDULED = "scheduled"
const STATUS_CANCELLED = "cancelled"

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

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { id: idParam } = await context.params
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = Number(idParam)
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  await ensureTables()

  const body = await request.json().catch(() => ({}))
  const action = body?.action

  if (action !== "cancel") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 })
  }

  const existing = await sql`
    SELECT status, campaign_id
    FROM newsletter_sends
    WHERE id = ${id}
  `

  if (existing.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const row = existing.rows[0] as { status: string; campaign_id: string | null }
  const currentStatus = row.status
  if (currentStatus !== STATUS_SCHEDULED) {
    return NextResponse.json({ error: "Only scheduled newsletters can be cancelled" }, { status: 400 })
  }

  const API_KEY = process.env.MAILERLITE_API_KEY?.trim() || ""
  const isNewApi = API_KEY.startsWith("eyJ")

  // If we have a MailerLite campaign id and new API key, try to cancel in MailerLite too
  if (isNewApi && row.campaign_id) {
    try {
      const mlRes = await fetch(`https://connect.mailerlite.com/api/campaigns/${row.campaign_id}/cancel`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      })

      if (!mlRes.ok) {
        const text = await mlRes.text()
        console.error("MailerLite cancel error:", text)
        return NextResponse.json({ error: "Failed to cancel in MailerLite" }, { status: 400 })
      }
    } catch (error) {
      console.error("MailerLite cancel exception:", error)
      return NextResponse.json({ error: "Failed to cancel in MailerLite" }, { status: 400 })
    }
  }

  await sql`
    UPDATE newsletter_sends
    SET status = ${STATUS_CANCELLED}, error = 'Cancelled from admin dashboard'
    WHERE id = ${id}
  `

  return NextResponse.json({ success: true })
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id: idParam } = await context.params

  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const id = Number(idParam)
  if (!id || Number.isNaN(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  await ensureTables()

  const existing = await sql`
    SELECT campaign_id
    FROM newsletter_sends
    WHERE id = ${id}
  `

  const campaignId = (existing.rows[0]?.campaign_id as string | null) ?? null

  const API_KEY = process.env.MAILERLITE_API_KEY?.trim() || ""
  const isNewApi = API_KEY.startsWith("eyJ")

  // If we have a MailerLite campaign id and new API key, attempt to delete there too
  if (isNewApi && campaignId) {
    try {
      const mlRes = await fetch(`https://connect.mailerlite.com/api/campaigns/${campaignId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          Accept: "application/json",
        },
      })

      if (!mlRes.ok && mlRes.status !== 404) {
        const text = await mlRes.text()
        console.error("MailerLite delete error:", text)
        return NextResponse.json({ error: "Failed to delete in MailerLite" }, { status: 400 })
      }
    } catch (error) {
      console.error("MailerLite delete exception:", error)
      return NextResponse.json({ error: "Failed to delete in MailerLite" }, { status: 400 })
    }
  }

  await sql`
    DELETE FROM newsletter_events
    WHERE send_id = ${id}
  `

  const deleted = await sql`
    DELETE FROM newsletter_sends
    WHERE id = ${id}
    RETURNING id
  `

  if (deleted.rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}


