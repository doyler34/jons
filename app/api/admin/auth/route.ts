import { NextRequest, NextResponse } from "next/server"

// Simple in-memory token store (works for single instance)
const validTokens = new Set<string>()

export async function POST(request: NextRequest) {
  try {
    const { password, token } = await request.json()
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

    // If token provided, validate it
    if (token) {
      if (validTokens.has(token)) {
        return NextResponse.json({ authenticated: true })
      }
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Password login
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

    // Create session token
    const sessionToken = Buffer.from(
      `${Date.now()}-${Math.random().toString(36)}`
    ).toString("base64")
    
    validTokens.add(sessionToken)
    
    // Clean old tokens (keep max 100)
    if (validTokens.size > 100) {
      const tokensArray = Array.from(validTokens)
      tokensArray.slice(0, tokensArray.length - 100).forEach(t => validTokens.delete(t))
    }

    return NextResponse.json({ success: true, token: sessionToken })
  } catch (error) {
    console.error("Admin auth error:", error)
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { token } = await request.json()
    if (token) {
      validTokens.delete(token)
    }
  } catch {
    // Ignore parse errors
  }
  return NextResponse.json({ success: true })
}

export async function GET(request: NextRequest) {
  const token = request.headers.get("Authorization")?.replace("Bearer ", "")
  
  if (!token || !validTokens.has(token)) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true })
}
