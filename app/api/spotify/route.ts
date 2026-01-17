import { NextRequest, NextResponse } from "next/server"
import { sql } from "@vercel/postgres"
import { getArtist, getTopTracks, getAlbums, getAllAlbumsWithTracks, FALLBACK_ARTIST, FALLBACK_TRACKS, FALLBACK_ALBUMS } from "@/lib/spotify"

export const dynamic = "force-dynamic"

type Override = {
  audio_url: string | null
  cover_url: string | null
  hidden: boolean
}

// Fetch overrides so custom audio/covers survive deployments and override Spotify preview/cover data
async function fetchOverrides(): Promise<Record<string, Override>> {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS song_overrides (
        id SERIAL PRIMARY KEY,
        spotify_id VARCHAR(255) UNIQUE NOT NULL,
        audio_url TEXT,
        cover_url TEXT,
        hidden BOOLEAN DEFAULT FALSE,
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `

    const result = await sql`
      SELECT spotify_id, audio_url, cover_url, hidden
      FROM song_overrides
    `

    const map: Record<string, Override> = {}
    for (const row of result.rows) {
      map[row.spotify_id] = {
        audio_url: row.audio_url,
        cover_url: row.cover_url,
        hidden: row.hidden || false,
      }
    }
    return map
  } catch (error) {
    console.error("Failed to fetch overrides in /api/spotify:", error)
    return {}
  }
}

function applyOverrideToTrack(track: any, overrides: Record<string, Override>) {
  const ov = overrides[track.id]
  if (!ov) {
    // No override - remove Spotify preview_url, only use manually uploaded audio
    return {
      ...track,
      preview_url: null, // Don't use Spotify preview URLs
    }
  }

  const images = ov.cover_url
    ? [{ url: ov.cover_url }, ...(track.album?.images || [])]
    : track.album?.images || []

  return {
    ...track,
    preview_url: ov.audio_url || null, // Only use manually uploaded audio, no Spotify fallback
    album: {
      ...track.album,
      images,
    },
  }
}

export async function GET(request: NextRequest) {
  // Check if force refresh is requested via timestamp param
  const searchParams = request.nextUrl.searchParams
  const forceRefresh = searchParams.has("t")
  
  try {
    const [artist, topTracksRaw, albumsRaw, albumsWithTracksRaw, overrides] = await Promise.all([
      getArtist(), 
      getTopTracks(), 
      getAlbums(),
      getAllAlbumsWithTracks(),
      fetchOverrides(),
    ])

    const topTracks = (topTracksRaw || [])
      .filter((t: any) => !overrides[t.id]?.hidden)
      .map((t: any) => applyOverrideToTrack(t, overrides))

    const albums = (albumsRaw || []).map((album: any) => {
      // Include album_type to distinguish between albums and singles
      return {
        ...album,
        album_type: album.album_type || "album", // Default to album if not specified
      }
    })

    const albumsWithTracks = (albumsWithTracksRaw || []).map((album: any) => {
      const tracks = (album.tracks || [])
        .filter((t: any) => !overrides[t.id]?.hidden)
        .map((t: any) => applyOverrideToTrack(t, overrides))

      return {
        ...album,
        tracks,
      }
    })

    const response = NextResponse.json({
      artist,
      topTracks,
      albums,
      albumsWithTracks,
    })
    
    // If force refresh, add no-cache headers
    if (forceRefresh) {
      response.headers.set("Cache-Control", "no-store, max-age=0")
    }
    
    return response
  } catch (error) {
    console.error("Spotify API error:", error)
    return NextResponse.json({
      artist: FALLBACK_ARTIST,
      topTracks: FALLBACK_TRACKS,
      albums: FALLBACK_ALBUMS,
      albumsWithTracks: [],
    })
  }
}
