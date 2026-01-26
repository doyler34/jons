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

  const API_KEY = process.env.BREVO_API_KEY?.trim()

  if (!API_KEY) {
    return NextResponse.json({ error: "Brevo not configured" }, { status: 500 })
  }

  try {
    const { id } = await params
    
    // Brevo uses numeric IDs, but we might receive email as ID
    // Try to delete by ID first, then by email if ID fails
    let response = await fetch(`https://api.brevo.com/v3/contacts/${id}`, {
      method: "DELETE",
      headers: {
        "api-key": API_KEY,
        "Accept": "application/json",
      },
    })

    // If deletion by ID fails, try by email
    if (!response.ok && id.includes("@")) {
      response = await fetch(`https://api.brevo.com/v3/contacts/${id}`, {
        method: "DELETE",
        headers: {
          "api-key": API_KEY,
          "Accept": "application/json",
        },
      })
    }

    if (!response.ok && response.status !== 404) {
      const errorText = await response.text()
      console.error("Brevo delete error:", errorText)
      return NextResponse.json({ error: "Failed to delete subscriber" }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Subscriber deleted" })
  } catch (error) {
    console.error("Delete subscriber error:", error)
    return NextResponse.json({ error: "Failed to delete subscriber" }, { status: 500 })
  }
}
