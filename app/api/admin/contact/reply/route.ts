import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { to, toName, originalSubject, replyMessage } = await request.json()

    if (!to || !replyMessage) {
      return NextResponse.json(
        { error: "Recipient email and message are required" },
        { status: 400 }
      )
    }

    const RESEND_API_KEY = process.env.RESEND_API_KEY

    if (!RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      )
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Jon Spirit <noreply@reply.jonspirit.com>",
        to: to,
        reply_to: "info@jonspirit.com",
        subject: `Re: ${originalSubject}`,
        html: `
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
                          Hey ${toName}! 👋
                        </h2>
                        <div style="color: #d4d4d4; line-height: 1.7; white-space: pre-wrap;">
${replyMessage}
                        </div>
                        <div style="margin-top: 24px; padding-top: 24px; border-top: 1px solid #262626;">
                          <p style="color: #888; font-size: 14px; margin: 0;">
                            — Jon Spirit 🖤
                          </p>
                        </div>
                      </td>
                    </tr>

                    <!-- Social Links -->
                    <tr>
                      <td align="center" style="padding: 24px 0;">
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
      }),
    })

    const data = await response.json()

    if (response.ok) {
      return NextResponse.json({ success: true, message: "Reply sent successfully!" })
    } else {
      console.error("Resend error:", data)
      return NextResponse.json({ error: data.message || "Failed to send reply" }, { status: 500 })
    }
  } catch (error) {
    console.error("Reply email error:", error)
    return NextResponse.json(
      { error: "An error occurred while sending the reply" },
      { status: 500 }
    )
  }
}

