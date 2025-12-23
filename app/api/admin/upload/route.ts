import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { cookies } from "next/headers"

// Configure route to handle larger payloads
export const maxDuration = 60
export const runtime = 'nodejs'

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

    // Validate file type - allow images and audio
    const isImage = file.type.startsWith("image/")
    const isAudio = file.type.startsWith("audio/")
    
    // Also check by file extension if MIME type is missing
    const fileName = file.name.toLowerCase()
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.wma']
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    const isAudioByExtension = audioExtensions.some(ext => fileName.endsWith(ext))
    const isImageByExtension = imageExtensions.some(ext => fileName.endsWith(ext))
    
    const finalIsAudio = isAudio || isAudioByExtension
    const finalIsImage = isImage || isImageByExtension
    
    console.log(`Upload: ${file.name}, size: ${file.size} bytes (${(file.size / 1024 / 1024).toFixed(2)} MB), type: ${file.type}, isAudio: ${finalIsAudio}, isImage: ${finalIsImage}`)
    
    if (!finalIsImage && !finalIsAudio) {
      return NextResponse.json({ error: "File must be an image or audio file" }, { status: 400 })
    }

    // Validate file size (max 4MB for images, max 50MB for audio)
    const maxSize = finalIsAudio ? 50 * 1024 * 1024 : 4 * 1024 * 1024
    if (file.size > maxSize) {
      const maxSizeMB = finalIsAudio ? "50MB" : "4MB"
      const actualSizeMB = (file.size / 1024 / 1024).toFixed(2)
      return NextResponse.json({ 
        error: `File too large: ${actualSizeMB}MB exceeds max ${maxSizeMB} for ${finalIsAudio ? 'audio' : 'image'} files` 
      }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split(".").pop() || (finalIsAudio ? "mp3" : "jpg")
    const prefix = finalIsAudio ? "song" : "newsletter"
    const filename = `${prefix}-${timestamp}.${extension}`

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




