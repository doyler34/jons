import { sql } from "@vercel/postgres"
import { NextResponse } from "next/server"

// This endpoint creates the song_overrides table
// Run once: GET /api/db/setup
export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS song_overrides (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        spotify_id TEXT UNIQUE NOT NULL,
        audio_url TEXT,
        cover_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Create index for faster lookups
    await sql`
      CREATE INDEX IF NOT EXISTS idx_song_overrides_spotify_id 
      ON song_overrides(spotify_id)
    `

    return NextResponse.json({ 
      success: true, 
      message: "Database table created successfully" 
    })
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      { error: "Failed to create database table", details: String(error) },
      { status: 500 }
    )
  }
}


