import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAdminSessionToken } from "@/lib/admin-session"

// Generate a client upload token for direct uploads to Vercel Blob
export async function POST(request: NextRequest) {
  // Check authentication
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  const secret = process.env.ADMIN_PASSWORD
  const ok = !!secret && verifyAdminSessionToken(session?.value, secret)

  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { filename } = await request.json()

    if (!filename) {
      return NextResponse.json({ error: "Filename required" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const extension = filename.split(".").pop() || "mp3"
    const uniqueFilename = `song-${timestamp}-${random}.${extension}`

    // Return token for client-side upload
    return NextResponse.json({
      token: process.env.BLOB_READ_WRITE_TOKEN,
      filename: uniqueFilename,
    })
  } catch (error) {
    console.error("Token generation error:", error)
    return NextResponse.json({ error: "Failed to generate upload token" }, { status: 500 })
  }
}
