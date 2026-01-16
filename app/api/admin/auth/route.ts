import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createAdminSessionToken, getAdminSessionMaxAgeSeconds, verifyAdminSessionToken } from "@/lib/admin-session"

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

    if (!ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Admin not configured" },
        { status: 500 }
      )
    }

    if (password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid password" },
        { status: 401 }
      )
    }

    // Create a signed session token (stateless) with expiry
    const sessionToken = createAdminSessionToken(ADMIN_PASSWORD)

    // Set session cookie (8 hours)
    const cookieStore = await cookies()
    cookieStore.set("admin_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: getAdminSessionMaxAgeSeconds(),
      path: "/",
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Admin auth error:", error)
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  // Logout - clear session
  const cookieStore = await cookies()
  cookieStore.delete("admin_session")
  return NextResponse.json({ success: true })
}

export async function GET() {
  // Check if logged in
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD
  const ok = ADMIN_PASSWORD ? verifyAdminSessionToken(session?.value, ADMIN_PASSWORD) : false

  if (!ok) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true })
}









