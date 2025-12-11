import { NextResponse } from "next/server"
import { getArtist, getTopTracks, getAlbums, FALLBACK_ARTIST, FALLBACK_TRACKS, FALLBACK_ALBUMS } from "@/lib/spotify"

export async function GET() {
  try {
    const [artist, topTracks, albums] = await Promise.all([getArtist(), getTopTracks(), getAlbums()])

    return NextResponse.json({
      artist,
      topTracks,
      albums,
    })
  } catch (error) {
    console.error("Spotify API error:", error)
    return NextResponse.json({
      artist: FALLBACK_ARTIST,
      topTracks: FALLBACK_TRACKS,
      albums: FALLBACK_ALBUMS,
    })
  }
}
