import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email is required" },
        { status: 400 }
      )
    }

    const API_KEY = process.env.MAILERLITE_API_KEY?.trim()
    const GROUP_ID = process.env.MAILERLITE_GROUP_ID

    if (!API_KEY) {
      console.error("MAILERLITE_API_KEY is not configured")
      return NextResponse.json(
        { error: "Newsletter service not configured" },
        { status: 500 }
      )
    }

    // Debug: show key info
    console.log("API Key length:", API_KEY.length)
    console.log("API Key starts with:", API_KEY.substring(0, 5))
    console.log("API Key ends with:", API_KEY.substring(API_KEY.length - 5))

    // Detect API type: new API keys start with "eyJ" (JWT), classic keys don't
    const isNewApi = API_KEY.startsWith("eyJ")
    console.log("Using API type:", isNewApi ? "NEW (JWT)" : "CLASSIC")
    
    let response: Response

    if (isNewApi) {
      // New MailerLite API (connect.mailerlite.com)
      response = await fetch("https://connect.mailerlite.com/api/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({ email }),
      })
    } else {
      // Classic MailerLite API (api.mailerlite.com)
      let url = "https://api.mailerlite.com/api/v2/subscribers"
      if (GROUP_ID) {
        url = `https://api.mailerlite.com/api/v2/groups/${GROUP_ID}/subscribers`
      }

      response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-MailerLite-ApiKey": API_KEY,
        },
        body: JSON.stringify({ email }),
      })
    }

    const data = await response.json()

    if (!response.ok) {
      // Handle already subscribed case gracefully
      if (response.status === 422 && data.message?.includes("already")) {
        return NextResponse.json({ success: true, message: "Already subscribed!" })
      }
      
      console.error("MailerLite error:", data)
      return NextResponse.json(
        { error: data.message || "Failed to subscribe" },
        { status: response.status }
      )
    }

    return NextResponse.json({ success: true, message: "Successfully subscribed!" })
  } catch (error) {
    console.error("Newsletter subscription error:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    )
  }
}

