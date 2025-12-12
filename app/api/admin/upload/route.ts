import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  // Check authentication
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 })
    }

    // Validate file size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large (max 4MB)" }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split(".").pop() || "jpg"
    const filename = `newsletter-${timestamp}.${extension}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: "public",
    })

    return NextResponse.json({ 
      success: true, 
      url: blob.url,
      filename: filename
    })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}



