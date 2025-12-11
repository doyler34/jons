const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET
const ARTIST_ID = "2JvA93ASY6Tq4bISN2eh6Z"

export interface SpotifyTrack {
  id: string
  name: string
  duration_ms: number
  preview_url: string | null
  album: {
    id: string
    name: string
    images: { url: string; height: number; width: number }[]
  }
  external_urls: {
    spotify: string
  }
}

export interface SpotifyArtist {
  id: string
  name: string
  images: { url: string; height: number; width: number }[]
  followers: { total: number }
  genres: string[]
  external_urls: {
    spotify: string
  }
}

export interface SpotifyAlbum {
  id: string
  name: string
  images: { url: string; height: number; width: number }[]
  release_date: string
  total_tracks: number
  external_urls: {
    spotify: string
  }
}

export const FALLBACK_ARTIST: SpotifyArtist = {
  id: ARTIST_ID,
  name: "Jon Spirit",
  images: [{ url: "/jon-spirit-rapper-artist-photo.jpg", height: 640, width: 640 }],
  followers: { total: 15000 },
  genres: ["hip hop", "rap", "underground"],
  external_urls: { spotify: "https://open.spotify.com/artist/2JvA93ASY6Tq4bISN2eh6Z" },
}

export const FALLBACK_TRACKS: SpotifyTrack[] = [
  {
    id: "1",
    name: "Sidedude",
    duration_ms: 180000,
    preview_url: null,
    album: { id: "a1", name: "Sidedude", images: [{ url: "/sidedude-album-cover-dark-hip-hop.jpg", height: 300, width: 300 }] },
    external_urls: { spotify: "https://open.spotify.com/artist/2JvA93ASY6Tq4bISN2eh6Z" },
  },
  {
    id: "2",
    name: "FEASTAHZ",
    duration_ms: 210000,
    preview_url: null,
    album: { id: "a2", name: "FEASTAHZ", images: [{ url: "/feastahz-album-cover-underground-rap.jpg", height: 300, width: 300 }] },
    external_urls: { spotify: "https://open.spotify.com/artist/2JvA93ASY6Tq4bISN2eh6Z" },
  },
  {
    id: "3",
    name: "Spirit World",
    duration_ms: 195000,
    preview_url: null,
    album: { id: "a3", name: "Spirit World", images: [{ url: "/spirit-world-album-cover-dark-aesthetic.jpg", height: 300, width: 300 }] },
    external_urls: { spotify: "https://open.spotify.com/artist/2JvA93ASY6Tq4bISN2eh6Z" },
  },
  {
    id: "4",
    name: "No Cap",
    duration_ms: 175000,
    preview_url: null,
    album: { id: "a4", name: "No Cap", images: [{ url: "/no-cap-hip-hop-album-cover.jpg", height: 300, width: 300 }] },
    external_urls: { spotify: "https://open.spotify.com/artist/2JvA93ASY6Tq4bISN2eh6Z" },
  },
  {
    id: "5",
    name: "Late Nights",
    duration_ms: 220000,
    preview_url: null,
    album: { id: "a5", name: "Late Nights", images: [{ url: "/late-nights-rap-album-cover-neon.jpg", height: 300, width: 300 }] },
    external_urls: { spotify: "https://open.spotify.com/artist/2JvA93ASY6Tq4bISN2eh6Z" },
  },
]

export const FALLBACK_ALBUMS: SpotifyAlbum[] = [
  {
    id: "a1",
    name: "Sidedude",
    images: [{ url: "/sidedude-album-cover.jpg", height: 300, width: 300 }],
    release_date: "2024",
    total_tracks: 1,
    external_urls: { spotify: "https://open.spotify.com/artist/2JvA93ASY6Tq4bISN2eh6Z" },
  },
  {
    id: "a2",
    name: "FEASTAHZ",
    images: [{ url: "/feastahz-album-cover.jpg", height: 300, width: 300 }],
    release_date: "2024",
    total_tracks: 1,
    external_urls: { spotify: "https://open.spotify.com/artist/2JvA93ASY6Tq4bISN2eh6Z" },
  },
]

async function getAccessToken(): Promise<string | null> {
  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    console.error("Spotify credentials not configured")
    return null
  }

  try {
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      console.error("Failed to get Spotify token:", await response.text())
      return null
    }

    const data = await response.json()
    return data.access_token
  } catch (error) {
    console.error("Spotify auth error:", error)
    return null
  }
}

export async function getArtist(): Promise<SpotifyArtist> {
  const token = await getAccessToken()
  if (!token) return FALLBACK_ARTIST

  try {
    const response = await fetch(`https://api.spotify.com/v1/artists/${ARTIST_ID}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    })
    if (!response.ok) return FALLBACK_ARTIST
    return response.json()
  } catch {
    return FALLBACK_ARTIST
  }
}

export async function getTopTracks(): Promise<SpotifyTrack[]> {
  const token = await getAccessToken()
  if (!token) return FALLBACK_TRACKS

  try {
    const response = await fetch(`https://api.spotify.com/v1/artists/${ARTIST_ID}/top-tracks?market=US`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    })
    if (!response.ok) return FALLBACK_TRACKS
    const data = await response.json()
    return data.tracks || FALLBACK_TRACKS
  } catch {
    return FALLBACK_TRACKS
  }
}

export async function getAlbums(): Promise<SpotifyAlbum[]> {
  const token = await getAccessToken()
  if (!token) return FALLBACK_ALBUMS

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${ARTIST_ID}/albums?include_groups=album,single&market=US&limit=50`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      },
    )
    if (!response.ok) return FALLBACK_ALBUMS
    const data = await response.json()
    return data.items || FALLBACK_ALBUMS
  } catch {
    return FALLBACK_ALBUMS
  }
}

export interface AlbumWithTracks extends SpotifyAlbum {
  tracks: SpotifyTrack[]
}

export async function getAlbumTracks(albumId: string): Promise<SpotifyTrack[]> {
  const token = await getAccessToken()
  if (!token) return []

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/albums/${albumId}/tracks?market=US&limit=50`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      },
    )
    if (!response.ok) return []
    const data = await response.json()
    return data.items || []
  } catch {
    return []
  }
}

export async function getAllAlbumsWithTracks(): Promise<AlbumWithTracks[]> {
  const token = await getAccessToken()
  if (!token) return []

  try {
    // Get all albums
    const albumsResponse = await fetch(
      `https://api.spotify.com/v1/artists/${ARTIST_ID}/albums?include_groups=album,single&market=US&limit=50`,
      {
        headers: { Authorization: `Bearer ${token}` },
        next: { revalidate: 3600 },
      },
    )
    if (!albumsResponse.ok) return []
    const albumsData = await albumsResponse.json()
    const albums: SpotifyAlbum[] = albumsData.items || []

    // Get tracks for each album
    const albumsWithTracks: AlbumWithTracks[] = await Promise.all(
      albums.map(async (album) => {
        const tracksResponse = await fetch(
          `https://api.spotify.com/v1/albums/${album.id}?market=US`,
          {
            headers: { Authorization: `Bearer ${token}` },
            next: { revalidate: 3600 },
          },
        )
        if (!tracksResponse.ok) {
          return { ...album, tracks: [] }
        }
        const albumData = await tracksResponse.json()
        
        // Map tracks to include album info and external_urls
        const tracks: SpotifyTrack[] = (albumData.tracks?.items || []).map((track: {
          id: string
          name: string
          duration_ms: number
          preview_url: string | null
          external_urls: { spotify: string }
        }) => ({
          ...track,
          album: {
            id: album.id,
            name: album.name,
            images: album.images,
          },
          external_urls: track.external_urls,
        }))

        return { ...album, tracks }
      })
    )

    return albumsWithTracks
  } catch (error) {
    console.error("Error fetching albums with tracks:", error)
    return []
  }
}

export function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function formatFollowers(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}
