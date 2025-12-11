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

    if (isNewApi) {
      // New MailerLite API - always fetch all subscribers
      const url = "https://connect.mailerlite.com/api/subscribers?limit=50&sort=-created_at"

      response = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Accept": "application/json",
        },
      })
    } else {
      // Classic MailerLite API
      const url = "https://api.mailerlite.com/api/v2/subscribers?limit=50"

      response = await fetch(url, {
        headers: {
          "X-MailerLite-ApiKey": API_KEY,
          "Accept": "application/json",
        },
      })
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

    return NextResponse.json({
      subscribers,
      total: isNewApi ? (data.meta?.total || subscribers.length) : subscribers.length,
    })
  } catch (error) {
    console.error("Failed to fetch subscribers:", error)
    return NextResponse.json({ subscribers: [], total: 0 })
  }
}

