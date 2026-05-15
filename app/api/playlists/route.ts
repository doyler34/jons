import { NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"

// Ensure tables exist
async function ensureTables() {
  await sql`
    CREATE TABLE IF NOT EXISTS playlists (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      cover_url TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `
  
  await sql`
    CREATE TABLE IF NOT EXISTS playlist_songs (
      id SERIAL PRIMARY KEY,
      playlist_id INTEGER REFERENCES playlists(id) ON DELETE CASCADE,
      song_id VARCHAR(255) NOT NULL,
      song_type VARCHAR(50) NOT NULL,
      title VARCHAR(255) NOT NULL,
      artist VARCHAR(255),
      album_name VARCHAR(255),
      cover_url TEXT,
      audio_url TEXT,
      duration_ms INTEGER DEFAULT 0,
      position INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `
}

// GET - Fetch all playlists with their songs
export async function GET(request: NextRequest) {
  try {
    await ensureTables()
    
    const { searchParams } = new URL(request.url)
    const playlistId = searchParams.get("id")
    
    if (playlistId) {
      // Fetch single playlist with songs
      const playlistResult = await sql`
        SELECT * FROM playlists WHERE id = ${playlistId}
      `
      
      if (playlistResult.rows.length === 0) {
        return NextResponse.json({ error: "Playlist not found" }, { status: 404 })
      }
      
      const songsResult = await sql`
        SELECT * FROM playlist_songs 
        WHERE playlist_id = ${playlistId}
        ORDER BY position ASC
      `
      
      return NextResponse.json({
        playlist: {
          ...playlistResult.rows[0],
          songs: songsResult.rows
        }
      })
    }
    
    // Fetch all playlists
    const playlistsResult = await sql`
      SELECT p.*, 
        (SELECT COUNT(*) FROM playlist_songs WHERE playlist_id = p.id) as song_count
      FROM playlists p
      ORDER BY updated_at DESC
    `
    
    return NextResponse.json({ playlists: playlistsResult.rows })
  } catch (error) {
    console.error("Failed to fetch playlists:", error)
    return NextResponse.json({ playlists: [] })
  }
}

// POST - Create playlist or add song to playlist
export async function POST(request: NextRequest) {
  try {
    await ensureTables()
    const body = await request.json()
    
    // Add song to playlist
    if (body.playlist_id && body.song) {
      const { playlist_id, song } = body
      
      // Get max position
      const posResult = await sql`
        SELECT COALESCE(MAX(position), -1) + 1 as next_pos 
        FROM playlist_songs 
        WHERE playlist_id = ${playlist_id}
      `
      const nextPos = posResult.rows[0].next_pos
      
      const result = await sql`
        INSERT INTO playlist_songs (
          playlist_id, song_id, song_type, title, artist, album_name, 
          cover_url, audio_url, duration_ms, position
        )
        VALUES (
          ${playlist_id}, ${song.song_id}, ${song.song_type}, ${song.title},
          ${song.artist || null}, ${song.album_name || null}, ${song.cover_url || null},
          ${song.audio_url || null}, ${song.duration_ms || 0}, ${nextPos}
        )
        RETURNING *
      `
      
      // Update playlist updated_at
      await sql`UPDATE playlists SET updated_at = NOW() WHERE id = ${playlist_id}`
      
      return NextResponse.json({ song: result.rows[0] })
    }
    
    // Create new playlist
    const { name, description, cover_url } = body
    
    if (!name?.trim()) {
      return NextResponse.json({ error: "Playlist name is required" }, { status: 400 })
    }
    
    const result = await sql`
      INSERT INTO playlists (name, description, cover_url)
      VALUES (${name}, ${description || null}, ${cover_url || null})
      RETURNING *
    `
    
    return NextResponse.json({ playlist: result.rows[0] })
  } catch (error) {
    console.error("Failed to create playlist/add song:", error)
    return NextResponse.json({ error: "Failed to save" }, { status: 500 })
  }
}

// PUT - Update playlist or reorder songs
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Update playlist details
    if (body.id && body.name) {
      const result = await sql`
        UPDATE playlists 
        SET name = ${body.name}, 
            description = ${body.description || null},
            cover_url = ${body.cover_url || null},
            updated_at = NOW()
        WHERE id = ${body.id}
        RETURNING *
      `
      return NextResponse.json({ playlist: result.rows[0] })
    }
    
    // Reorder songs
    if (body.playlist_id && body.song_order) {
      for (let i = 0; i < body.song_order.length; i++) {
        await sql`
          UPDATE playlist_songs 
          SET position = ${i}
          WHERE id = ${body.song_order[i]} AND playlist_id = ${body.playlist_id}
        `
      }
      await sql`UPDATE playlists SET updated_at = NOW() WHERE id = ${body.playlist_id}`
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("Failed to update:", error)
    return NextResponse.json({ error: "Failed to update" }, { status: 500 })
  }
}

// DELETE - Delete playlist or remove song from playlist
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const playlistId = searchParams.get("playlist_id")
    const songId = searchParams.get("song_id")
    
    if (songId && playlistId) {
      // Remove song from playlist
      await sql`DELETE FROM playlist_songs WHERE id = ${songId} AND playlist_id = ${playlistId}`
      await sql`UPDATE playlists SET updated_at = NOW() WHERE id = ${playlistId}`
      return NextResponse.json({ success: true })
    }
    
    if (playlistId) {
      // Delete entire playlist
      await sql`DELETE FROM playlists WHERE id = ${playlistId}`
      return NextResponse.json({ success: true })
    }
    
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  } catch (error) {
    console.error("Failed to delete:", error)
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 })
  }
}
