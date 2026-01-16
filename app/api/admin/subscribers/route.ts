import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAdminSessionToken } from "@/lib/admin-session"

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
    return NextResponse.json({ 
      subscribers: [], 
      total: 0,
      error: "Brevo not configured" 
    })
  }

  try {
    let allSubscribers: Array<{
      id: string
      email: string
      status: string
      created_at: string
    }> = []

    // If list ID is provided, fetch from that list, otherwise fetch all contacts
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
          const errorText = await response.text()
          console.error("Brevo API error:", errorText)
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
          const errorText = await response.text()
          console.error("Brevo API error:", errorText)
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

    return NextResponse.json({
      subscribers: allSubscribers,
      total: allSubscribers.length,
    })
  } catch (error) {
    console.error("Failed to fetch subscribers:", error)
    return NextResponse.json({ subscribers: [], total: 0 })
  }
}
