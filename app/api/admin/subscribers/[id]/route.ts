import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

// DELETE - Remove a subscriber (GDPR compliance)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const { id } = await params
    
    // Detect API type
    const isNewApi = API_KEY.startsWith("eyJ")
    
    let response: Response

    if (isNewApi) {
      // New MailerLite API
      response = await fetch(`https://connect.mailerlite.com/api/subscribers/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Accept": "application/json",
        },
      })
    } else {
      // Classic MailerLite API - delete by email or ID
      response = await fetch(`https://api.mailerlite.com/api/v2/subscribers/${id}`, {
        method: "DELETE",
        headers: {
          "X-MailerLite-ApiKey": API_KEY,
          "Accept": "application/json",
        },
      })
    }

    if (!response.ok && response.status !== 204) {
      const errorText = await response.text()
      console.error("MailerLite delete error:", errorText)
      return NextResponse.json({ error: "Failed to delete subscriber" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Subscriber deleted" })
  } catch (error) {
    console.error("Delete subscriber error:", error)
    return NextResponse.json({ error: "Failed to delete subscriber" }, { status: 500 })
  }
}

