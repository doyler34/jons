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

    const API_KEY = process.env.BREVO_API_KEY?.trim()
    const LIST_ID = process.env.BREVO_LIST_ID?.trim()
    const FROM_EMAIL = process.env.BREVO_FROM_EMAIL?.trim() || "noreply@jonspirit.com"
    const FROM_NAME = process.env.BREVO_FROM_NAME?.trim() || "Jon Spirit"

    if (!API_KEY) {
      console.error("BREVO_API_KEY is not configured")
      return NextResponse.json(
        { error: "Newsletter service not configured" },
        { status: 500 }
      )
    }

    // Add contact to Brevo list
    const contactPayload: Record<string, unknown> = {
      email,
      listIds: LIST_ID ? [Number(LIST_ID)] : [],
    }

    const contactResponse = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "api-key": API_KEY,
      },
      body: JSON.stringify(contactPayload),
    })

    const contactData = await contactResponse.json()

    // Handle already subscribed case gracefully (Brevo returns 400 for duplicate)
    if (contactResponse.status === 400 && (contactData.message?.includes("already") || contactData.code === "duplicate_parameter")) {
      // Still send welcome email even if already subscribed
      try {
        await sendWelcomeEmail(email, FROM_EMAIL, FROM_NAME, API_KEY)
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError)
      }
      return NextResponse.json({ success: true, message: "Already subscribed!" })
    }

    if (!contactResponse.ok) {
      console.error("Brevo contact error:", contactData)
      return NextResponse.json(
        { error: contactData.message || "Failed to subscribe" },
        { status: contactResponse.status }
      )
    }

    // Send welcome/auto-reply email
    try {
      await sendWelcomeEmail(email, FROM_EMAIL, FROM_NAME, API_KEY)
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError)
      // Don't fail the subscription if email fails
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

async function sendWelcomeEmail(email: string, fromEmail: string, fromName: string, apiKey: string) {
  const emailPayload = {
    sender: {
      name: fromName,
      email: fromEmail,
    },
    to: [{ email }],
    subject: "Welcome to Jon Spirit! 🎤",
    htmlContent: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
          <tr>
            <td align="center" style="padding: 40px 20px;">
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
                
                <!-- Header -->
                <tr>
                  <td align="center" style="padding-bottom: 24px;">
                    <h1 style="margin: 0; font-size: 32px; font-weight: bold; color: #d8d0bf; font-family: Georgia, serif;">
                      JON SPIRIT
                    </h1>
                  </td>
                </tr>
                
                <!-- Content Card -->
                <tr>
                  <td style="background-color: #141414; border-radius: 8px; padding: 32px; border: 1px solid #262626;">
                    <h2 style="margin: 0 0 16px 0; font-size: 24px; color: #f5f5f5;">
                      Welcome! 👋
                    </h2>
                    <p style="color: #d4d4d4; line-height: 1.7; margin: 0 0 16px 0;">
                      Thanks for subscribing to my newsletter! You'll be the first to know about new releases, upcoming shows, and exclusive content.
                    </p>
                    <p style="color: #d4d4d4; line-height: 1.7; margin: 0 0 24px 0;">
                      Check out my latest tracks and follow me on socials to stay updated.
                    </p>
                    <p style="color: #888; font-size: 14px; margin: 0;">
                      — Jon Spirit 🖤
                    </p>
                  </td>
                </tr>

                <!-- CTA Button -->
                <tr>
                  <td align="center" style="padding: 24px 0;">
                    <a href="https://jonspirit.com/music" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-weight: bold; font-size: 14px; padding: 14px 32px; border-radius: 6px; text-decoration: none; letter-spacing: 1px;">
                      LISTEN NOW
                    </a>
                  </td>
                </tr>

                <!-- Social Links -->
                <tr>
                  <td align="center" style="padding: 16px 0 24px 0;">
                    <table role="presentation" cellspacing="0" cellpadding="0">
                      <tr>
                        <td style="padding: 0 12px;">
                          <a href="https://open.spotify.com/artist/2JvA93ASY6Tq4bISN2eh6Z" style="color: #1DB954; text-decoration: none; font-size: 13px; font-weight: 600;">Spotify</a>
                        </td>
                        <td style="padding: 0 12px;">
                          <a href="https://www.instagram.com/jonspirit.mp4/" style="color: #E4405F; text-decoration: none; font-size: 13px; font-weight: 600;">Instagram</a>
                        </td>
                        <td style="padding: 0 12px;">
                          <a href="https://www.youtube.com/@Jonspiritprime" style="color: #FF0000; text-decoration: none; font-size: 13px; font-weight: 600;">YouTube</a>
                        </td>
                        <td style="padding: 0 12px;">
                          <a href="https://soundcloud.com/jonspirit" style="color: #FF5500; text-decoration: none; font-size: 13px; font-weight: 600;">SoundCloud</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td align="center" style="border-top: 1px solid #262626; padding-top: 24px;">
                    <p style="margin: 0 0 8px 0; color: #555; font-size: 11px;">© 2025 Jon Spirit</p>
                    <p style="margin: 0; color: #444; font-size: 11px;">
                      <a href="https://jonspirit.com" style="color: #888; text-decoration: none;">jonspirit.com</a>
                    </p>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }

  const emailResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify(emailPayload),
  })

  if (!emailResponse.ok) {
    const errorData = await emailResponse.json()
    throw new Error(errorData.message || "Failed to send welcome email")
  }
}
