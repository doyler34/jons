import { NextRequest, NextResponse } from "next/server"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { cookies } from "next/headers"

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Check authentication
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  if (!session?.value) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Validate file type by extension
        const fileName = pathname.toLowerCase()
        const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac', '.wma']
        const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
        const isAudio = audioExtensions.some(ext => fileName.endsWith(ext))
        const isImage = imageExtensions.some(ext => fileName.endsWith(ext))

        if (!isAudio && !isImage) {
          throw new Error("File must be an audio or image file")
        }

        return {
          allowedContentTypes: isAudio 
            ? ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac', 'audio/ogg', 'audio/flac', 'audio/x-m4a']
            : ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
          maximumSizeInBytes: isAudio ? 50 * 1024 * 1024 : 4 * 1024 * 1024,
        }
      },
      onUploadCompleted: async ({ blob }) => {
        console.log('Upload completed:', blob.url)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error('Token generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate upload token' },
      { status: 400 }
    )
  }
}

