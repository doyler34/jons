import { NextResponse } from "next/server"
import { cookies } from "next/headers"

// GET - Export all subscribers as CSV (GDPR compliance)
export async function GET() {
  // Check authentication
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const API_KEY = process.env.MAILERLITE_API_KEY?.trim()

  if (!API_KEY) {
    return NextResponse.json({ error: "MailerLite not configured" }, { status: 500 })
  }

  try {
    // Detect API type
    const isNewApi = API_KEY.startsWith("eyJ")
    
    let allSubscribers: Array<{
      id: string
      email: string
      status: string
      created_at: string
    }> = []

    if (isNewApi) {
      // New MailerLite API - fetch all pages
      let cursor: string | null = null
      let hasMore = true

      while (hasMore) {
        const url = cursor 
          ? `https://connect.mailerlite.com/api/subscribers?limit=100&cursor=${cursor}`
          : "https://connect.mailerlite.com/api/subscribers?limit=100"

        const response = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Accept": "application/json",
          },
        })

        if (!response.ok) {
          break
        }

        const data = await response.json()
        const subscribers = (data.data || []).map((sub: { id: string; email: string; status?: string; created_at?: string }) => ({
          id: sub.id,
          email: sub.email,
          status: sub.status || "active",
          created_at: sub.created_at || new Date().toISOString(),
        }))

        allSubscribers = [...allSubscribers, ...subscribers]

        // Check for next page
        cursor = data.meta?.next_cursor
        hasMore = !!cursor && subscribers.length > 0
      }
    } else {
      // Classic MailerLite API
      const response = await fetch("https://api.mailerlite.com/api/v2/subscribers?limit=1000", {
        headers: {
          "X-MailerLite-ApiKey": API_KEY,
          "Accept": "application/json",
        },
      })

      if (response.ok) {
        const data = await response.json()
        allSubscribers = (Array.isArray(data) ? data : []).map((sub: { id: string; email: string; type?: string; date_created?: string }) => ({
          id: sub.id,
          email: sub.email,
          status: sub.type || "active",
          created_at: sub.date_created || new Date().toISOString(),
        }))
      }
    }

    // Create CSV content
    const headers = ["Email", "Status", "Subscribed Date"]
    const rows = allSubscribers.map(sub => [
      sub.email,
      sub.status,
      new Date(sub.created_at).toISOString().split("T")[0],
    ])

    const csv = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(",")),
    ].join("\n")

    // Return as downloadable CSV
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="subscribers_${new Date().toISOString().split("T")[0]}.csv"`,
      },
    })
  } catch (error) {
    console.error("Export subscribers error:", error)
    return NextResponse.json({ error: "Failed to export subscribers" }, { status: 500 })
  }
}

