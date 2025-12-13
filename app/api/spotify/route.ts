import { NextRequest, NextResponse } from "next/server"
import { getArtist, getTopTracks, getAlbums, getAllAlbumsWithTracks, FALLBACK_ARTIST, FALLBACK_TRACKS, FALLBACK_ALBUMS } from "@/lib/spotify"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  // Check if force refresh is requested via timestamp param
  const searchParams = request.nextUrl.searchParams
  const forceRefresh = searchParams.has("t")
  
  try {
    const [artist, topTracks, albums, albumsWithTracks] = await Promise.all([
      getArtist(), 
      getTopTracks(), 
      getAlbums(),
      getAllAlbumsWithTracks()
    ])

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
