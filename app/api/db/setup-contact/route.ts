import { NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

export async function GET() {
  try {
    // Create contact_messages table
    await sql`
      CREATE TABLE IF NOT EXISTS contact_messages (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        subject VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        read BOOLEAN DEFAULT FALSE,
        replied BOOLEAN DEFAULT FALSE,
        archived BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `

    // Add replied column if it doesn't exist (for existing tables)
    try {
      await sql`
        ALTER TABLE contact_messages 
        ADD COLUMN IF NOT EXISTS replied BOOLEAN DEFAULT FALSE
      `
    } catch (error) {
      // Column might already exist, ignore error
      console.log("Replied column may already exist:", error)
    }

    // Create index for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_contact_created_at ON contact_messages(created_at DESC)
    `

    return NextResponse.json({ 
      success: true, 
      message: "Contact messages table created successfully" 
    })
  } catch (error) {
    console.error("Database setup error:", error)
    return NextResponse.json(
      { error: "Failed to setup database", details: error },
      { status: 500 }
    )
  }
}

