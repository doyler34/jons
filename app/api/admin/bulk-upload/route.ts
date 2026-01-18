import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { cookies } from "next/headers"
import { verifyAdminSessionToken } from "@/lib/admin-session"

// Configure route for large file uploads (App Router)
export const runtime = "nodejs"
export const maxDuration = 60

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
    const formData = await request.formData()
    const files = formData.getAll("files") as File[]

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 })
    }

    // Limit to 10 files per upload
    if (files.length > 10) {
      return NextResponse.json({ error: "Maximum 10 files allowed per upload" }, { status: 400 })
    }

    const uploadedFiles: Array<{
      originalName: string
      blobUrl: string
      filename: string
      size: number
    }> = []

    // Upload each file to Vercel Blob
    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith("audio/")) {
        return NextResponse.json(
          { error: `File ${file.name} is not an audio file` },
          { status: 400 }
        )
      }

      // Validate file size (max 50MB per file)
      const maxSize = 50 * 1024 * 1024
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} is too large (max 50MB)` },
          { status: 400 }
        )
      }

      // Generate unique filename
      const timestamp = Date.now()
      const random = Math.random().toString(36).substring(7)
      const extension = file.name.split(".").pop() || "mp3"
      const filename = `song-${timestamp}-${random}.${extension}`

      // Upload to Vercel Blob
      const blob = await put(filename, file, {
        access: "public",
      })

      uploadedFiles.push({
        originalName: file.name,
        blobUrl: blob.url,
        filename: filename,
        size: file.size,
      })
    }

    return NextResponse.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length,
    })
  } catch (error) {
    console.error("Bulk upload error:", error)
    return NextResponse.json(
      { error: "Bulk upload failed", details: String(error) },
      { status: 500 }
    )
  }
}
