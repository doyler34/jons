import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function GET() {
  // Check authentication
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const API_KEY = process.env.MAILERLITE_API_KEY?.trim()
  const GROUP_ID = (process.env.MAILERLITE_GROUP_ID || process.env.MAILERLITE_GROUPID || process.env.MAILERLITE_GROUP_ID_DEFAULT || "").trim() || undefined

  if (!API_KEY) {
    return NextResponse.json({ 
      subscribers: [], 
      total: 0,
      error: "MailerLite not configured" 
    })
  }

  try {
    // Detect API type: new API keys start with "eyJ" (JWT), classic keys don't
    const isNewApi = API_KEY.startsWith("eyJ")
    
    let response: Response

    const baseHeadersNew = {
      "Authorization": `Bearer ${API_KEY}`,
      "Accept": "application/json",
    }
    const baseHeadersClassic = {
      "X-MailerLite-ApiKey": API_KEY,
      "Accept": "application/json",
    }

    if (isNewApi) {
      // New MailerLite API - fetch all subscribers and attach to group if provided
      const url = "https://connect.mailerlite.com/api/subscribers?limit=100&sort=-created_at"

      response = await fetch(url, { headers: baseHeadersNew })
    } else {
      // Classic MailerLite API
      const url = "https://api.mailerlite.com/api/v2/subscribers?limit=1000"

      response = await fetch(url, { headers: baseHeadersClassic })
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error("MailerLite API error:", errorText)
      return NextResponse.json({ subscribers: [], total: 0, error: errorText })
    }

    const data = await response.json()

    // Handle both API response formats
    const rawSubscribers = isNewApi ? data.data : data
    const subscribers = (Array.isArray(rawSubscribers) ? rawSubscribers : []).map((sub: { id: string; email: string; status?: string; type?: string; created_at?: string; date_created?: string }) => ({
      id: sub.id,
      email: sub.email,
      status: sub.status || sub.type || "active",
      created_at: sub.created_at || sub.date_created || new Date().toISOString(),
    }))

    // If a group is provided, try to ensure all subscribers are in it (best-effort, non-blocking)
    if (GROUP_ID && subscribers.length > 0) {
      try {
        if (isNewApi) {
          // New API: use bulk upsert or per-subscriber group attach
          await fetch(`https://connect.mailerlite.com/api/subscribers/import`, {
            method: "POST",
            headers: {
              ...baseHeadersNew,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              subscribers: subscribers.map((s) => ({ email: s.email, groups: [GROUP_ID] })),
              auto_confirm: true,
            }),
          })
        } else {
          // Classic API: bulk import into group
          await fetch(`https://api.mailerlite.com/api/v2/groups/${GROUP_ID}/subscribers/import`, {
            method: "POST",
            headers: {
              ...baseHeadersClassic,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              subscribers: subscribers.map((s) => ({ email: s.email })),
            }),
          })
        }
      } catch (err) {
        console.error("Failed to attach subscribers to group:", err)
      }
    }

    return NextResponse.json({
      subscribers,
      total: isNewApi ? (data.meta?.total || subscribers.length) : subscribers.length,
    })
  } catch (error) {
    console.error("Failed to fetch subscribers:", error)
    return NextResponse.json({ subscribers: [], total: 0 })
  }
}

