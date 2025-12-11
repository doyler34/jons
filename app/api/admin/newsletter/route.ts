import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
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
    const { subject, type, posterUrl, posterText, content, buttonText, buttonLink } = await request.json()

    console.log("Newsletter payload received:", { subject, type, posterUrl: posterUrl?.substring(0, 50), posterText, buttonText, buttonLink })

    if (!subject) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 })
    }

    if (type === "poster" && !posterUrl) {
      return NextResponse.json({ error: "Poster image is required" }, { status: 400 })
    }

    if (type === "text" && !content) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    // Generate HTML based on type
    const emailHTML = type === "poster" 
      ? generatePosterEmailHTML(subject, posterUrl, posterText, buttonText, buttonLink)
      : generateTextEmailHTML(subject, content, buttonText, buttonLink)

    // Detect API type: new API keys start with "eyJ" (JWT), classic keys don't
    const isNewApi = API_KEY.startsWith("eyJ")

    if (isNewApi) {
      // New MailerLite API
      const FROM_EMAIL = process.env.MAILERLITE_FROM_EMAIL
      
      if (!FROM_EMAIL) {
        return NextResponse.json({ 
          error: "MAILERLITE_FROM_EMAIL not set. Add a verified sender email to .env.local" 
        }, { status: 400 })
      }

      const campaignPayload = {
        name: `Newsletter: ${subject} - ${new Date().toISOString()}`,
        type: "regular",
        emails: [{
          subject: subject,
          from_name: "Jon Spirit",
          from: FROM_EMAIL,
          content: emailHTML,
        }],
      }

      console.log("Creating campaign...")

      const campaignResponse = await fetch("https://connect.mailerlite.com/api/campaigns", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(campaignPayload),
      })

      const responseText = await campaignResponse.text()

      if (!campaignResponse.ok) {
        let error
        try {
          error = JSON.parse(responseText)
        } catch {
          error = { message: responseText }
        }
        console.error("Campaign creation error:", error)
        return NextResponse.json({ 
          error: error.message || "Failed to create campaign" 
        }, { status: 400 })
      }

      const campaign = JSON.parse(responseText)
      const campaignId = campaign.data?.id

      if (!campaignId) {
        return NextResponse.json({ error: "Failed to get campaign ID" }, { status: 500 })
      }

      console.log("Campaign created with ID:", campaignId)
      console.log("Scheduling campaign for immediate delivery...")

      const sendResponse = await fetch(
        `https://connect.mailerlite.com/api/campaigns/${campaignId}/schedule`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            delivery: "instant",
          }),
        }
      )

      const sendResponseText = await sendResponse.text()
      console.log("Schedule response:", sendResponseText)

      if (!sendResponse.ok) {
        let error
        try {
          error = JSON.parse(sendResponseText)
        } catch {
          error = { message: sendResponseText }
        }
        console.error("Campaign send error:", error)
        return NextResponse.json({ 
          error: error.message || "Campaign created but failed to send",
          campaignId 
        }, { status: 400 })
      }

      return NextResponse.json({ 
        success: true, 
        message: "Newsletter sent successfully!",
        campaignId 
      })
    } else {
      // Classic MailerLite API
      const campaignResponse = await fetch("https://api.mailerlite.com/api/v2/campaigns", {
        method: "POST",
        headers: {
          "X-MailerLite-ApiKey": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: subject,
          name: `Newsletter: ${subject}`,
          type: "regular",
          from: process.env.MAILERLITE_FROM_EMAIL || "newsletter@jonspirit.com",
          from_name: "Jon Spirit",
        }),
      })

      if (!campaignResponse.ok) {
        const error = await campaignResponse.json()
        console.error("Campaign creation error:", error)
        return NextResponse.json({ 
          error: error.error?.message || "Failed to create campaign" 
        }, { status: 400 })
      }

      const campaign = await campaignResponse.json()
      const campaignId = campaign.id

      if (!campaignId) {
        return NextResponse.json({ error: "Failed to get campaign ID" }, { status: 500 })
      }

      // Add HTML content
      await fetch(`https://api.mailerlite.com/api/v2/campaigns/${campaignId}/content`, {
        method: "PUT",
        headers: {
          "X-MailerLite-ApiKey": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          html: emailHTML,
          plain: content || `${subject} - View this email in your browser to see the full content.`,
        }),
      })

      // Send campaign
      const sendResponse = await fetch(
        `https://api.mailerlite.com/api/v2/campaigns/${campaignId}/actions/send`,
        {
          method: "POST",
          headers: {
            "X-MailerLite-ApiKey": API_KEY,
          },
        }
      )

      if (!sendResponse.ok) {
        const error = await sendResponse.json()
        console.error("Campaign send error:", error)
        return NextResponse.json({ 
          error: error.error?.message || "Campaign created but failed to send",
          campaignId 
        }, { status: 400 })
      }

      return NextResponse.json({ 
        success: true, 
        message: "Newsletter sent successfully!",
        campaignId 
      })
    }
  } catch (error) {
    console.error("Newsletter send error:", error)
    return NextResponse.json({ error: "Failed to send newsletter" }, { status: 500 })
  }
}

function generatePosterEmailHTML(subject: string, posterUrl: string, posterText?: string, buttonText?: string, buttonLink?: string): string {
  // Convert poster text line breaks to HTML
  const textHTML = posterText ? `
          <!-- Text Content -->
          <tr>
            <td style="padding-bottom: 24px;">
              <div style="color: #d4d4d4; font-size: 16px; line-height: 1.7; text-align: center;">
                ${posterText.split("\n").map(line => line.trim()).filter(line => line).map(line => `<p style="margin: 0 0 12px 0;">${line}</p>`).join("")}
              </div>
            </td>
          </tr>` : ""

  const buttonHTML = buttonText && buttonLink ? `
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 24px 0;">
              <a href="${buttonLink}" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-weight: bold; font-size: 14px; padding: 14px 32px; border-radius: 6px; text-decoration: none; letter-spacing: 1px;">
                ${buttonText}
              </a>
            </td>
          </tr>` : ""

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 24px;">
              <h1 style="margin: 0; font-size: 36px; font-weight: bold; color: #d8d0bf; font-family: 'Brush Script MT', 'Lucida Handwriting', Georgia, cursive;">
                JON SPIRIT
              </h1>
            </td>
          </tr>
${textHTML}
          <!-- POSTER IMAGE -->
          <tr>
            <td align="center">
              <a href="${buttonLink || 'https://jonspirit.com/music'}" style="display: block;">
                <img src="${posterUrl}" alt="${subject}" style="max-width: 100%; width: 600px; height: auto; border-radius: 8px; display: block;" />
              </a>
            </td>
          </tr>
${buttonHTML}
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
                <a href="{$unsubscribe}" style="color: #dc2626; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}

function generateTextEmailHTML(subject: string, content: string, buttonText?: string, buttonLink?: string): string {
  // Convert line breaks to paragraphs
  const paragraphs = content
    .split("\n\n")
    .map(p => p.trim())
    .filter(p => p)
    .map(p => `<p style="margin: 0 0 16px 0; line-height: 1.6;">${p.replace(/\n/g, "<br>")}</p>`)
    .join("")

  const buttonHTML = buttonText && buttonLink ? `
              <div style="padding-top: 24px;">
                <a href="${buttonLink}" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-weight: bold; font-size: 14px; padding: 14px 32px; border-radius: 6px; text-decoration: none; letter-spacing: 1px;">
                  ${buttonText}
                </a>
              </div>` : ""

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
          
          <!-- Header -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <h1 style="margin: 0; font-size: 36px; font-weight: bold; color: #d8d0bf; font-family: 'Brush Script MT', 'Lucida Handwriting', Georgia, cursive;">
                JON SPIRIT
              </h1>
            </td>
          </tr>
          
          <!-- Content Card -->
          <tr>
            <td style="background-color: #141414; border-radius: 12px; padding: 40px; border: 1px solid #262626;">
              <h2 style="margin: 0 0 24px 0; font-size: 28px; font-weight: bold; color: #f5f5f5;">
                ${subject}
              </h2>
              <div style="color: #d4d4d4; font-size: 16px; line-height: 1.7;">
                ${paragraphs}
              </div>
${buttonHTML}
            </td>
          </tr>

          <!-- Social Links -->
          <tr>
            <td align="center" style="padding: 32px 0;">
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
                <a href="{$unsubscribe}" style="color: #dc2626; text-decoration: underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim()
}
