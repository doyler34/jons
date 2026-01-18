import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import { cookies } from "next/headers"
import { verifyAdminSessionToken } from "@/lib/admin-session"

export async function GET() {
  // Check authentication - admin only
  const cookieStore = await cookies()
  const session = cookieStore.get("admin_session")
  const secret = process.env.ADMIN_PASSWORD
  const ok = !!secret && verifyAdminSessionToken(session?.value, secret)

  if (!ok) {
    return NextResponse.json({ error: "Unauthorized - Admin access only" }, { status: 401 })
  }

  try {
    // Check if manual_songs table exists
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'manual_songs'
      );
    `

    // Get all manual songs
    const manualSongs = await sql`
      SELECT * FROM manual_songs ORDER BY created_at DESC
    `

    // Get all song overrides
    const overrides = await sql`
      SELECT * FROM song_overrides ORDER BY updated_at DESC
    `

    return NextResponse.json({
      tableExists: tableCheck.rows[0]?.exists || false,
      manual_songs: {
        count: manualSongs.rows.length,
        songs: manualSongs.rows,
      },
      song_overrides: {
        count: overrides.rows.length,
        overrides: overrides.rows,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Debug error:", error)
    return NextResponse.json({
      error: String(error),
      message: "Failed to fetch database info",
    }, { status: 500 })
  }
}
