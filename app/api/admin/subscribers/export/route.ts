import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAdminSessionToken } from "@/lib/admin-session"

// GET - Export all subscribers as CSV (GDPR compliance)
export async function GET() {
  // Check authentication
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  const secret = process.env.ADMIN_PASSWORD
  const ok = !!secret && verifyAdminSessionToken(session?.value, secret)

  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const API_KEY = process.env.BREVO_API_KEY?.trim()
  const LIST_ID = process.env.BREVO_LIST_ID?.trim()

  if (!API_KEY) {
    return NextResponse.json({ error: "Brevo not configured" }, { status: 500 })
  }

  try {
    let allSubscribers: Array<{
      id: string
      email: string
      status: string
      created_at: string
    }> = []

    // Fetch all contacts from the list or all contacts
    if (LIST_ID) {
      let offset = 0
      const limit = 50
      let hasMore = true

      while (hasMore) {
        const response = await fetch(
          `https://api.brevo.com/v3/contacts/lists/${LIST_ID}/contacts?limit=${limit}&offset=${offset}`,
          {
            headers: {
              "api-key": API_KEY,
              "Accept": "application/json",
            },
          }
        )

        if (!response.ok) {
          break
        }

        const data = await response.json()
        const contacts = data.contacts || []
        
        const subscribers = contacts.map((contact: { id: number; email: string; createdAt: string; attributes?: Record<string, unknown> }) => ({
          id: String(contact.id),
          email: contact.email,
          status: contact.attributes?.STATUS || "active",
          created_at: contact.createdAt || new Date().toISOString(),
        }))

        allSubscribers = [...allSubscribers, ...subscribers]
        
        hasMore = contacts.length === limit
        offset += limit
      }
    } else {
      // Fetch all contacts
      let offset = 0
      const limit = 50
      let hasMore = true

      while (hasMore) {
        const response = await fetch(
          `https://api.brevo.com/v3/contacts?limit=${limit}&offset=${offset}`,
          {
            headers: {
              "api-key": API_KEY,
              "Accept": "application/json",
            },
          }
        )

        if (!response.ok) {
          break
        }

        const data = await response.json()
        const contacts = data.contacts || []
        
        const subscribers = contacts.map((contact: { id: number; email: string; createdAt: string; attributes?: Record<string, unknown> }) => ({
          id: String(contact.id),
          email: contact.email,
          status: contact.attributes?.STATUS || "active",
          created_at: contact.createdAt || new Date().toISOString(),
        }))

        allSubscribers = [...allSubscribers, ...subscribers]
        
        hasMore = contacts.length === limit
        offset += limit
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
