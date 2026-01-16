import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json()

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      )
    }

    // Email subject mapping
    const subjectMap: Record<string, string> = {
      booking: "Booking Inquiry",
      feature: "Feature Request",
      press: "Press & Media",
      collaboration: "Collaboration",
      other: "General Inquiry",
    }

    const emailSubject = `[Jon Spirit] ${subjectMap[subject] || subject} from ${name}`
    const CONTACT_EMAIL = process.env.CONTACT_EMAIL || "info@jonspirit.com"
    const BREVO_API_KEY = process.env.BREVO_API_KEY
    const FROM_EMAIL = process.env.BREVO_FROM_EMAIL?.trim() || "noreply@jonspirit.com"
    const FROM_NAME = process.env.BREVO_FROM_NAME?.trim() || "Jon Spirit"

    if (!BREVO_API_KEY) {
      console.error("BREVO_API_KEY is not configured")
      return NextResponse.json(
        { error: "Email service not configured" },
        { status: 500 }
      )
    }

    // Send contact form email to domain email using Brevo
    const contactEmailPayload = {
      sender: {
        name: FROM_NAME,
        email: FROM_EMAIL,
      },
      to: [{ email: CONTACT_EMAIL }],
      replyTo: { email, name },
      subject: emailSubject,
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
                      <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #d8d0bf; font-family: Georgia, serif;">
                        JON SPIRIT
                      </h1>
                    </td>
                  </tr>
                  
                  <!-- Content Card -->
                  <tr>
                    <td style="background-color: #141414; border-radius: 8px; padding: 32px; border: 1px solid #262626;">
                      <h2 style="margin: 0 0 24px 0; font-size: 20px; font-weight: bold; color: #dc2626;">
                        📬 New Contact Form Submission
                      </h2>
                      
                      <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                          <td style="padding: 12px 0; color: #888; width: 100px; vertical-align: top;"><strong>Name:</strong></td>
                          <td style="padding: 12px 0; color: #f5f5f5;">${name}</td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; color: #888; vertical-align: top;"><strong>Email:</strong></td>
                          <td style="padding: 12px 0;"><a href="mailto:${email}" style="color: #dc2626;">${email}</a></td>
                        </tr>
                        <tr>
                          <td style="padding: 12px 0; color: #888; vertical-align: top;"><strong>Subject:</strong></td>
                          <td style="padding: 12px 0; color: #f5f5f5;">${subjectMap[subject] || subject}</td>
                        </tr>
                      </table>
                      
                      <div style="margin-top: 24px; padding: 20px; background: #1a1a1a; border-radius: 8px; border-left: 3px solid #dc2626;">
                        <h3 style="margin: 0 0 12px 0; color: #f5f5f5; font-size: 14px;">Message:</h3>
                        <p style="margin: 0; white-space: pre-wrap; line-height: 1.6; color: #d4d4d4;">${message}</p>
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
                        Sent from <a href="https://jonspirit.com" style="color: #888; text-decoration: none;">jonspirit.com</a>
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

    const contactResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(contactEmailPayload),
    })

    const contactData = await contactResponse.json()

    if (!contactResponse.ok) {
      console.error("Brevo error:", contactData)
      return NextResponse.json({ error: contactData.message || "Failed to send message" }, { status: 500 })
    }

    // Send acknowledgment email to the person who submitted
    const ackEmailPayload = {
      sender: {
        name: FROM_NAME,
        email: FROM_EMAIL,
      },
      to: [{ email, name }],
      subject: "Got your message! 🎤 - Jon Spirit",
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
                        Hey ${name}! 👋
                      </h2>
                      <p style="color: #d4d4d4; line-height: 1.7; margin: 0 0 16px 0;">
                        Thanks for reaching out! I got your message and will get back to you as soon as possible.
                      </p>
                      <p style="color: #d4d4d4; line-height: 1.7; margin: 0 0 24px 0;">
                        In the meantime, check out my latest tracks and follow me on socials to stay updated.
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

    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": BREVO_API_KEY,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(ackEmailPayload),
    }).catch((error) => {
      console.error("Failed to send acknowledgment email:", error)
      // Don't fail the request if ack email fails
    })

    return NextResponse.json({ success: true, message: "Message sent successfully!" })
  } catch (error) {
    console.error("Contact form error:", error)
    return NextResponse.json(
      { error: "An error occurred. Please try again." },
      { status: 500 }
    )
  }
}
