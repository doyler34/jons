"use client"
import Navigation from "@/components/navigation"
import PlayerBar from "@/components/player-bar"
import NewsletterForm from "@/components/newsletter-form"
import { useState, useEffect } from "react"
import { Play, Pause, Loader2, ExternalLink, Clock, Disc3, ChevronLeft } from "lucide-react"

interface SpotifyTrack {
  id: string
  name: string
  duration_ms: number
  preview_url: string | null
  track_number?: number
  album: {
    id: string
    name: string
    images: { url: string }[]
  }
  external_urls: {
    spotify: string
  }
}

interface SpotifyAlbum {
  id: string
  name: string
  images: { url: string; height?: number; width?: number }[]
  release_date: string
  total_tracks: number
  external_urls: {
    spotify: string
  }
  tracks: SpotifyTrack[]
}

interface TrackDisplay {
  id: string
  title: string
  duration: string
  durationMs: number
  image: string
  previewUrl: string | null
  spotifyUrl: string
  albumName: string
  albumId: string
  trackNumber?: number
}

interface SongOverride {
  audio_url: string | null
  cover_url: string | null
  hidden?: boolean
}

interface ManualSong {
  id: number
  title: string
  album_name: string
  audio_url: string
  cover_url: string | null
  created_at: string
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export default function MusicPage() {
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([])
  const [topTracks, setTopTracks] = useState<TrackDisplay[]>([])
  const [selectedAlbum, setSelectedAlbum] = useState<SpotifyAlbum | null>(null)
  const [currentTrack, setCurrentTrack] = useState<TrackDisplay | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(true)
  const [overrides, setOverrides] = useState<Record<string, SongOverride>>({})
  const [manualSongs, setManualSongs] = useState<ManualSong[]>([])
  const [autoplayAlbumId, setAutoplayAlbumId] = useState<string | null>(null)

  // Save current track to localStorage for iOS PWA persistence
  useEffect(() => {
    if (currentTrack) {
      localStorage.setItem("jonspirit_current_track", JSON.stringify(currentTrack))
    }
  }, [currentTrack])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [spotifyRes, overridesRes, manualSongsRes] = await Promise.all([
          fetch("/api/spotify"),
          fetch("/api/songs/overrides"),
          fetch("/api/songs/manual"),
        ])

        const spotifyData = await spotifyRes.json()
        const overridesData = await overridesRes.json()
        const manualSongsData = await manualSongsRes.json()
        const overridesMap: Record<string, SongOverride> = overridesData.overrides || {}
        setOverrides(overridesMap)
        setManualSongs(manualSongsData.songs || [])

        // Set albums with tracks
        let albumsList: SpotifyAlbum[] = spotifyData.albumsWithTracks || []
        
        // Group manual songs by album_name and create virtual albums
        if (manualSongsData.songs && manualSongsData.songs.length > 0) {
          const manualSongsByAlbum: Record<string, ManualSong[]> = {}
          manualSongsData.songs.forEach((song: ManualSong) => {
            const albumName = song.album_name || "Singles"
            if (!manualSongsByAlbum[albumName]) {
              manualSongsByAlbum[albumName] = []
            }
            manualSongsByAlbum[albumName].push(song)
          })
          
          // Convert manual songs to virtual albums
          Object.entries(manualSongsByAlbum).forEach(([albumName, songs]) => {
            const tracks: SpotifyTrack[] = songs.map((song: ManualSong) => ({
              id: `manual-${song.id}`,
              name: song.title,
              duration_ms: 0, // Duration not stored for manual songs
              preview_url: song.audio_url, // Store audio_url in preview_url for manual songs
              track_number: undefined,
              album: {
                id: `manual-album-${albumName}`,
                name: albumName,
                images: song.cover_url ? [{ url: song.cover_url, height: 300, width: 300 }] : [],
              },
              external_urls: {
                spotify: "#", // Manual songs don't have Spotify links
              },
            }))
            
            albumsList.push({
              id: `manual-album-${albumName}`,
              name: albumName,
              images: songs[0]?.cover_url ? [{ url: songs[0].cover_url, height: 300, width: 300 }] : [],
              release_date: songs[0]?.created_at?.split("T")[0] || new Date().toISOString().split("T")[0],
              total_tracks: songs.length,
              external_urls: {
                spotify: "#",
              },
              tracks,
            })
          })
        }
        
        setAlbums(albumsList)

        // Set top tracks
        if (spotifyData.topTracks) {
          const formatted = spotifyData.topTracks
            // Hide tracks that are marked hidden in overrides
            .filter((track: SpotifyTrack) => !overridesMap[track.id]?.hidden)
            .map((track: SpotifyTrack) => ({
              id: track.id,
              title: track.name,
              duration: formatDuration(track.duration_ms),
              durationMs: track.duration_ms,
              image: (overridesMap[track.id]?.cover_url as string | null) || track.album.images[0]?.url || "/placeholder.svg",
              previewUrl: (overridesMap[track.id]?.audio_url as string | null) || null, // Only use manually uploaded audio, no Spotify preview
              spotifyUrl: track.external_urls.spotify,
              albumName: track.album.name,
              albumId: track.album.id,
            }))
          setTopTracks(formatted)
          
          // Try to restore saved track from localStorage (for iOS PWA)
          const savedTrack = localStorage.getItem("jonspirit_current_track")
          if (savedTrack) {
            try {
              const parsed = JSON.parse(savedTrack)
              // Find matching track in the loaded data to ensure it's still valid
              const matchingTrack = formatted.find((t: TrackDisplay) => t.id === parsed.id)
              if (matchingTrack) {
                setCurrentTrack(matchingTrack)
              } else {
                setCurrentTrack(formatted[0])
              }
            } catch {
              setCurrentTrack(formatted[0])
            }
          } else if (formatted.length > 0) {
            setCurrentTrack(formatted[0])
          }
        }
      } catch (err) {
        console.error("Failed to fetch data:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // If album is specified in URL (?album=...) select it and autoplay first track
  useEffect(() => {
    if (!albums.length) return
    if (typeof window === "undefined") return

    const params = new URLSearchParams(window.location.search)
    const albumParam = params.get("album")
    if (!albumParam) return

    const match = albums.find(
      (album) =>
        album.id === albumParam || album.name.toLowerCase() === albumParam.toLowerCase(),
    )
    if (match) {
      setSelectedAlbum(match)
      setAutoplayAlbumId(match.id)
      window.scrollTo(0, 0)
    }
  }, [albums])

  const getTrackWithOverride = (track: SpotifyTrack): TrackDisplay => {
    const override = overrides[track.id]
    // For manual songs (id starts with "manual-"), use the preview_url directly (it contains the audio_url)
    const isManualSong = track.id.startsWith("manual-")
    return {
      id: track.id,
      title: track.name,
      duration: track.duration_ms > 0 ? formatDuration(track.duration_ms) : "—",
      durationMs: track.duration_ms,
      image: override?.cover_url || track.album.images[0]?.url || "/placeholder.svg",
      previewUrl: isManualSong ? track.preview_url : (override?.audio_url || null), // Only use manually uploaded audio, no Spotify preview
      spotifyUrl: track.external_urls.spotify,
      albumName: track.album.name,
      albumId: track.album.id,
      trackNumber: track.track_number,
    }
  }

  const playTrack = (track: TrackDisplay) => {
    setCurrentTrack(track)
    setIsPlaying(true)
  }

  // Autoplay first track when an album is selected via click or URL param
  useEffect(() => {
    if (!selectedAlbum || autoplayAlbumId !== selectedAlbum.id) return
    const albumTracks = selectedAlbum.tracks
      .filter((track) => !overrides[track.id]?.hidden)
      .map(getTrackWithOverride)
    if (albumTracks.length > 0) {
      playTrack(albumTracks[0])
      setAutoplayAlbumId(null)
    }
  }, [selectedAlbum, autoplayAlbumId, overrides])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // Album Detail View
  if (selectedAlbum) {
    const albumTracks = selectedAlbum.tracks
      // Hide tracks that are marked hidden in overrides
      .filter((track) => !overrides[track.id]?.hidden)
      .map(getTrackWithOverride)
    const totalDuration = selectedAlbum.tracks.reduce((acc, t) => acc + t.duration_ms, 0)

    return (
      <div className="min-h-screen bg-background pb-32">
        <Navigation />
        
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-6">
          {/* Back Button */}
          <button
            onClick={() => setSelectedAlbum(null)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ChevronLeft size={20} />
            Back to Discography
          </button>

          {/* Album Header */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
            <div className="w-48 h-48 md:w-64 md:h-64 flex-shrink-0 mx-auto md:mx-0">
              <img
                src={selectedAlbum.images[0]?.url || "/placeholder.svg"}
                alt={selectedAlbum.name}
                className="w-full h-full object-cover rounded-lg shadow-2xl"
              />
            </div>
            <div className="flex flex-col justify-end text-center md:text-left">
              <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                {selectedAlbum.total_tracks === 1 ? "Single" : "Album"}
              </p>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-black mb-4 text-foreground">
                {selectedAlbum.name}
              </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground justify-center md:justify-start">
                <span className="font-semibold text-foreground">Jon Spirit</span>
                <span>•</span>
                <span>{selectedAlbum.release_date.split("-")[0]}</span>
                <span>•</span>
                <span>{selectedAlbum.total_tracks} {selectedAlbum.total_tracks === 1 ? "song" : "songs"}</span>
                <span>•</span>
                <span>{formatDuration(totalDuration)}</span>
              </div>
            </div>
          </div>

          {/* Play All Button */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <button
              onClick={() => albumTracks.length > 0 && playTrack(albumTracks[0])}
              className="flex w-full sm:w-auto items-center justify-center gap-2 px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full transition-all"
            >
              <Play size={20} fill="currentColor" />
              Play
            </button>
            <a
              href={selectedAlbum.external_urls.spotify}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full sm:w-auto items-center justify-center gap-2 px-6 py-3 border border-border hover:border-foreground text-foreground font-semibold rounded-full transition-all"
            >
              <ExternalLink size={18} />
              Open in Spotify
            </a>
          </div>

          {/* Track List */}
          <div className="bg-card/50 rounded-lg">
            {/* Header */}
            <div className="grid grid-cols-[auto_1fr_auto] md:grid-cols-[40px_1fr_auto] gap-4 px-4 py-3 border-b border-border text-xs uppercase tracking-wider text-muted-foreground">
              <span className="text-center">#</span>
              <span>Title</span>
              <span className="flex items-center gap-1">
                <Clock size={14} />
              </span>
            </div>

            {/* Tracks */}
            {albumTracks.map((track, index) => (
              <div
                key={track.id}
                onClick={() => playTrack(track)}
                className={`grid grid-cols-[auto_1fr_auto] md:grid-cols-[40px_1fr_auto] gap-4 px-4 py-3 hover:bg-muted/50 cursor-pointer transition-colors group ${
                  currentTrack?.id === track.id ? "bg-primary/10" : ""
                }`}
              >
                <span className={`text-center text-sm ${currentTrack?.id === track.id ? "text-primary" : "text-muted-foreground"}`}>
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Pause size={14} className="mx-auto text-primary" />
                  ) : (
                    <span className="group-hover:hidden">{index + 1}</span>
                  )}
                  <Play size={14} className="mx-auto hidden group-hover:block" />
                </span>
                <div className="min-w-0">
                  <p className={`font-medium truncate ${currentTrack?.id === track.id ? "text-primary" : "text-foreground"}`}>
                    {track.title}
                  </p>
                </div>
                <span className="text-sm text-muted-foreground">{track.duration}</span>
              </div>
            ))}
          </div>
        </div>

        {currentTrack && (
          <PlayerBar
            currentTrack={{
              title: currentTrack.title,
              duration: currentTrack.duration,
              image: currentTrack.image,
              previewUrl: currentTrack.previewUrl,
            }}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
          />
        )}
      </div>
    )
  }

  // Main Music Page
  return (
    <div className="min-h-screen bg-background pb-32">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-6 md:py-12">
        {/* Header */}
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-8 md:mb-12 text-foreground tracking-tighter">
          MUSIC
        </h1>

        {/* Popular Tracks */}
        <section className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
            <Play size={24} className="text-primary" fill="currentColor" />
            Popular
          </h2>
          <div className="space-y-2">
            {topTracks.slice(0, 5).map((track, index) => (
              <div
                key={track.id}
                onClick={() => playTrack(track)}
                className={`flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group ${
                  currentTrack?.id === track.id ? "bg-primary/10" : ""
                }`}
              >
                <span className={`w-6 text-center text-sm ${currentTrack?.id === track.id ? "text-primary" : "text-muted-foreground"}`}>
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Pause size={14} className="mx-auto" />
                  ) : (
                    <>
                      <span className="group-hover:hidden">{index + 1}</span>
                      <Play size={14} className="mx-auto hidden group-hover:block" />
                    </>
                  )}
                </span>
                <img
                  src={track.image}
                  alt={track.title}
                  className="w-12 h-12 rounded object-cover"
                />
                <div className="flex-1 min-w-0">
                  <p className={`font-medium truncate ${currentTrack?.id === track.id ? "text-primary" : "text-foreground"}`}>
                    {track.title}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">{track.albumName}</p>
                </div>
                <span className="text-sm text-muted-foreground">{track.duration}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Discography */}
        <section className="mb-12">
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
            <Disc3 size={24} className="text-primary" />
            Discography
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {albums.map((album) => (
              <div
                key={album.id}
                onClick={() => {
                  setSelectedAlbum(album)
                  setAutoplayAlbumId(album.id)
                  window.scrollTo(0, 0)
                }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-square mb-3 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={album.images[0]?.url || "/placeholder.svg"}
                    alt={album.name}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
                      <Play size={24} className="text-primary-foreground ml-1" fill="currentColor" />
                    </div>
                  </div>
                </div>
                <h3 className="font-semibold text-foreground truncate text-sm md:text-base">
                  {album.name}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground">
                  {album.release_date.split("-")[0]} • {album.total_tracks === 1 ? "Single" : "Album"}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Newsletter Signup */}
        <div className="bg-card border border-border rounded-lg p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            GET LATEST RELEASES
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Be the first to know when new music drops. No spam, just fire tracks.
          </p>
          <NewsletterForm />
        </div>
      </div>

      {currentTrack && (
        <PlayerBar
          currentTrack={{
            title: currentTrack.title,
            duration: currentTrack.duration,
            image: currentTrack.image,
            previewUrl: currentTrack.previewUrl,
          }}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
        />
      )}
    </div>
  )
}
