import { NextResponse } from "next/server"
import { getArtist, getTopTracks, getAlbums, getAllAlbumsWithTracks, FALLBACK_ARTIST, FALLBACK_TRACKS, FALLBACK_ALBUMS } from "@/lib/spotify"

export async function GET() {
  try {
    const [artist, topTracks, albums, albumsWithTracks] = await Promise.all([
      getArtist(), 
      getTopTracks(), 
      getAlbums(),
      getAllAlbumsWithTracks()
    ])

    return NextResponse.json({
      artist,
      topTracks,
      albums,
      albumsWithTracks,
    })
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
