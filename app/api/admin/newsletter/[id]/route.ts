import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@vercel/postgres"
import { verifyAdminSessionToken } from "@/lib/admin-session"

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

  const secret = process.env.ADMIN_PASSWORD
  const ok = !!secret && verifyAdminSessionToken(session?.value, secret)

  if (!ok) {
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

  // Note: Brevo transactional emails sent immediately can't be cancelled
  // Only scheduled ones in our DB can be cancelled
  // If the campaign was actually scheduled in Brevo (which requires their campaigns API),
  // you would need to cancel it there, but for now we'll just update our DB

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

  const secret = process.env.ADMIN_PASSWORD
  const ok = !!secret && verifyAdminSessionToken(session?.value, secret)

  if (!ok) {
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

  // Note: Brevo transactional emails can't be deleted after sending
  // If using Brevo's campaigns API, you could delete campaigns there
  // For now, we'll just remove from our database

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
