import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@vercel/postgres"

type SendMode = "now" | "schedule"

const STATUS_SCHEDULED = "scheduled"
const STATUS_SENDING = "sending"
const STATUS_SENT = "sent"
const STATUS_ERROR = "error"

const ensureTables = async () => {
  await sql`
    CREATE TABLE IF NOT EXISTS newsletter_sends (
      id SERIAL PRIMARY KEY,
      subject TEXT NOT NULL,
      type VARCHAR(20) NOT NULL,
      body_html TEXT,
      poster_url TEXT,
      poster_text TEXT,
      button_text TEXT,
      button_link TEXT,
      status VARCHAR(20) DEFAULT 'scheduled',
      scheduled_at TIMESTAMPTZ,
      sent_at TIMESTAMPTZ,
      error TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `

  // New MailerLite campaign id storage
  await sql`ALTER TABLE newsletter_sends ADD COLUMN IF NOT EXISTS campaign_id TEXT`

  await sql`
    CREATE TABLE IF NOT EXISTS newsletter_events (
      id SERIAL PRIMARY KEY,
      send_id INTEGER,
      event_type VARCHAR(20) NOT NULL,
      link_url TEXT,
      user_agent TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
}

const sanitizeHtml = (html: string) => {
  if (!html) return ""
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
}

const applyTokens = (html: string) =>
  html
    .replace(/{{\s*name\s*}}/gi, "{$name}")
    .replace(/{{\s*email\s*}}/gi, "{$email}")
    .replace(/{{\s*unsubscribe\s*}}/gi, "{$unsubscribe}")

const getBaseUrl = (request: NextRequest) => {
  const host = request.headers.get("host")
  const proto = request.headers.get("x-forwarded-proto") || "https"
  if (host?.startsWith("http")) return host
  if (host) return `${proto}://${host}`
  return process.env.NEXT_PUBLIC_SITE_URL || "https://jonspirit.com"
}

const wrapLinksWithTracking = (html: string, baseUrl: string, sendId: number) => {
  const trackingBase = `${baseUrl}/api/newsletter/click?id=${sendId}&url=`
  return html.replace(/href="(https?:[^"]+)"/gi, (_match, url) => {
    return `href="${trackingBase}${encodeURIComponent(url)}"`
  })
}

const addTrackingPixel = (html: string, baseUrl: string, sendId: number) => {
  const pixel = `<img src="${baseUrl}/api/newsletter/open?id=${sendId}" alt="" width="1" height="1" style="display:none;" />`
  if (html.includes("</body>")) {
    return html.replace("</body>", `${pixel}</body>`)
  }
  return html + pixel
}

const withTracking = (html: string, baseUrl: string, sendId: number) =>
  addTrackingPixel(wrapLinksWithTracking(applyTokens(sanitizeHtml(html)), baseUrl, sendId), baseUrl, sendId)

const generatePosterEmailHTML = (
  subject: string,
  posterUrl: string,
  posterText: string | undefined,
  buttonText: string | undefined,
  buttonLink: string | undefined,
  baseUrl: string,
  sendId: number
) => {
  const safePosterText = posterText
    ? posterText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => `<p style="margin: 0 0 12px 0;">${line}</p>`)
        .join("")
    : ""

  const trackedLink = buttonLink ? `${baseUrl}/api/newsletter/click?id=${sendId}&url=${encodeURIComponent(buttonLink)}` : ""

  const textHTML = safePosterText
    ? `
          <!-- Text Content -->
          <tr>
            <td style="padding-bottom: 24px;">
              <div style="color: #d4d4d4; font-size: 16px; line-height: 1.7; text-align: center;">
                ${safePosterText}
              </div>
            </td>
          </tr>`
    : ""

  const buttonHTML =
    buttonText && buttonLink
      ? `
          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding: 24px 0;">
              <a href="${trackedLink}" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-weight: bold; font-size: 14px; padding: 14px 32px; border-radius: 6px; text-decoration: none; letter-spacing: 1px;">
                ${buttonText}
              </a>
            </td>
          </tr>`
      : ""

  const html = `
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
              <a href="${trackedLink || "https://jonspirit.com/music"}" style="display: block;">
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

  return withTracking(html, baseUrl, sendId)
}

const generateTextEmailHTML = (
  subject: string,
  htmlContent: string,
  buttonText: string | undefined,
  buttonLink: string | undefined,
  baseUrl: string,
  sendId: number
) => {
  const trackedLink = buttonLink ? `${baseUrl}/api/newsletter/click?id=${sendId}&url=${encodeURIComponent(buttonLink)}` : ""
  const safeContent = sanitizeHtml(htmlContent || "")

  const buttonHTML =
    buttonText && buttonLink
      ? `
              <div style="padding-top: 24px;">
                <a href="${trackedLink}" style="display: inline-block; background-color: #dc2626; color: #ffffff; font-weight: bold; font-size: 14px; padding: 14px 32px; border-radius: 6px; text-decoration: none; letter-spacing: 1px;">
                  ${buttonText}
                </a>
              </div>`
      : ""

  const html = `
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
                ${safeContent}
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

  return withTracking(html, baseUrl, sendId)
}

const sendWithMailerLite = async (
  subject: string,
  html: string,
  API_KEY: string,
  mode: "send" | "draft" | "schedule" = "send",
  scheduledAt?: string
) => {
  const isNewApi = API_KEY.startsWith("eyJ")

  if (isNewApi) {
    const FROM_EMAIL = process.env.MAILERLITE_FROM_EMAIL

    if (!FROM_EMAIL) {
      return { ok: false, error: "MAILERLITE_FROM_EMAIL not set. Add a verified sender email to .env.local" }
    }

    const campaignPayload = {
      name: `Newsletter: ${subject} - ${new Date().toISOString()}`,
      type: "regular",
      emails: [
        {
          subject: subject,
          from_name: "Jon Spirit",
          from: FROM_EMAIL,
          content: html,
        },
      ],
    }

    const campaignResponse = await fetch("https://connect.mailerlite.com/api/campaigns", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
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
      return { ok: false, error: error.message || "Failed to create campaign" }
    }

    const campaign = JSON.parse(responseText)
    const campaignId = campaign.data?.id

    if (!campaignId) {
      return { ok: false, error: "Failed to get campaign ID" }
    }

    // New MailerLite API:
    // - mode "draft": just create the campaign (shows as draft in MailerLite)
    // - mode "send": send immediately
    // - mode "schedule": schedule in MailerLite for the provided date/time
    if (mode === "draft") {
      return { ok: true, campaignId }
    }

    let scheduleBody: Record<string, unknown> = { delivery: "instant" }

    if (mode === "schedule" && scheduledAt) {
      const date = new Date(scheduledAt)
      if (!isNaN(date.getTime())) {
        const iso = date.toISOString()
        const [isoDate, isoTime] = iso.split("T")
        const [hours, minutes] = isoTime.split(":")

        scheduleBody = {
          delivery: "scheduled",
          schedule: {
            date: isoDate,
            hours,
            minutes,
          },
        }
      }
    }

    const sendResponse = await fetch(`https://connect.mailerlite.com/api/campaigns/${campaignId}/schedule`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(scheduleBody),
    })

    const sendResponseText = await sendResponse.text()

    if (!sendResponse.ok) {
      let error
      try {
        error = JSON.parse(sendResponseText)
      } catch {
        error = { message: sendResponseText }
      }
      console.error("Campaign send error:", error)
      return { ok: false, error: error.message || "Campaign created but failed to send", campaignId }
    }

    return { ok: true, campaignId }
  }

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
    return { ok: false, error: error.error?.message || "Failed to create campaign" }
  }

  const campaign = await campaignResponse.json()
  const campaignId = campaign.id

  if (!campaignId) {
    return { ok: false, error: "Failed to get campaign ID" }
  }

  await fetch(`https://api.mailerlite.com/api/v2/campaigns/${campaignId}/content`, {
    method: "PUT",
    headers: {
      "X-MailerLite-ApiKey": API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      html,
      plain: `${subject} - View this email in your browser to see the full content.`,
    }),
  })

  // Classic MailerLite API:
  // - mode "draft": campaign with content is saved as a draft
  // - mode "send": also trigger the send action
  // - mode "schedule": not supported via classic API → fall back to draft only
  if (mode === "draft" || mode === "schedule") {
    return { ok: true, campaignId }
  }

  const sendResponse = await fetch(`https://api.mailerlite.com/api/v2/campaigns/${campaignId}/actions/send`, {
    method: "POST",
    headers: {
      "X-MailerLite-ApiKey": API_KEY,
    },
  })

  if (!sendResponse.ok) {
    const error = await sendResponse.json()
    console.error("Campaign send error:", error)
    return { ok: false, error: error.error?.message || "Campaign created but failed to send", campaignId }
  }

  return { ok: true, campaignId }
}

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

  await ensureTables()

  try {
    const body = await request.json()
    const { subject, type, posterUrl, posterText, htmlContent, buttonText, buttonLink, sendMode = "now", scheduledAt } = body as {
      subject: string
      type: "poster" | "text"
      posterUrl?: string
      posterText?: string
      htmlContent?: string
      buttonText?: string
      buttonLink?: string
      sendMode?: SendMode
      scheduledAt?: string
    }

    console.log("Newsletter payload received:", {
      subject,
      type,
      posterUrl: posterUrl?.substring(0, 50),
      posterText,
      buttonText,
      buttonLink,
      sendMode,
      scheduledAt,
    })

    if (!subject) {
      return NextResponse.json({ error: "Subject is required" }, { status: 400 })
    }

    if (type === "poster" && !posterUrl) {
      return NextResponse.json({ error: "Poster image is required" }, { status: 400 })
    }

    if (type === "text" && !htmlContent) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 })
    }

    const baseUrl = getBaseUrl(request)
    const sanitizedContent = sanitizeHtml(htmlContent || "")
    const sanitizedPoster = sanitizeHtml(posterText || "")

    const isScheduled = sendMode === "schedule"

    const insertResult = await sql`
      INSERT INTO newsletter_sends (subject, type, body_html, poster_url, poster_text, button_text, button_link, status, scheduled_at)
      VALUES (
        ${subject},
        ${type},
        ${type === "text" ? sanitizedContent : null},
        ${posterUrl || null},
        ${type === "poster" ? sanitizedPoster : null},
        ${buttonText || null},
        ${buttonLink || null},
        ${isScheduled ? STATUS_SCHEDULED : STATUS_SENDING},
        ${isScheduled && scheduledAt ? scheduledAt : null}
      )
      RETURNING id
    `

    const sendId = insertResult.rows[0]?.id as number

    const emailHTML =
      type === "poster"
        ? generatePosterEmailHTML(subject, posterUrl!, sanitizedPoster, buttonText, buttonLink, baseUrl, sendId)
        : generateTextEmailHTML(subject, sanitizedContent, buttonText, buttonLink, baseUrl, sendId)

    // Behavior:
    // - sendMode "now": send immediately
    // - sendMode "schedule": schedule in MailerLite for the chosen time
    const sendResult = await sendWithMailerLite(
      subject,
      emailHTML,
      API_KEY,
      isScheduled ? "schedule" : "send",
      scheduledAt
    )

    if (!sendResult.ok) {
      await sql`
        UPDATE newsletter_sends
        SET status = ${STATUS_ERROR}, error = ${sendResult.error || "Send failed"}
        WHERE id = ${sendId}
      `

      return NextResponse.json({ error: sendResult.error || "Failed to send newsletter" }, { status: 400 })
    }

    // Store MailerLite campaign id for later cancel/delete actions
    if (sendResult.campaignId) {
      await sql`
        UPDATE newsletter_sends
        SET campaign_id = ${sendResult.campaignId}
        WHERE id = ${sendId}
      `
    }

    if (isScheduled) {
      await sql`
        UPDATE newsletter_sends
        SET status = ${STATUS_SCHEDULED}, sent_at = NULL, error = NULL
        WHERE id = ${sendId}
      `
    } else {
      await sql`
        UPDATE newsletter_sends
        SET status = ${STATUS_SENT}, sent_at = NOW(), error = NULL
        WHERE id = ${sendId}
      `
    }

    return NextResponse.json({
      success: true,
      message: isScheduled ? "Newsletter scheduled in MailerLite." : "Newsletter sent successfully!",
      campaignId: sendResult.campaignId,
      sendId,
    })
  } catch (error) {
    console.error("Newsletter send error:", error)
    return NextResponse.json({ error: "Failed to send newsletter" }, { status: 500 })
  }
}
