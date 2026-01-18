import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyAdminSessionToken } from "@/lib/admin-session"

export async function POST(request: Request): Promise<NextResponse> {
  // Check authentication
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")

  const secret = process.env.ADMIN_PASSWORD
  const ok = !!secret && verifyAdminSessionToken(session?.value, secret)

  if (!ok) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Generate unique filename
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        const extension = pathname.split(".").pop() || "mp3"
        const filename = `song-${timestamp}-${random}.${extension}`

        return {
          allowedContentTypes: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/m4a", "audio/ogg"],
          tokenPayload: JSON.stringify({
            // Optional metadata
          }),
          pathname: filename,
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("Upload completed:", blob.pathname)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("Upload token error:", error)
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 400 }
    )
  }
}
