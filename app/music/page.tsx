"use client"
import Navigation from "@/components/navigation"
import PlayerBar from "@/components/player-bar"
import NewsletterForm from "@/components/newsletter-form"
import { useState, useEffect } from "react"
import { Play, Pause, Loader2, ExternalLink } from "lucide-react"

interface SpotifyTrack {
  id: string
  name: string
  duration_ms: number
  preview_url: string | null
  album: {
    name: string
    images: { url: string }[]
  }
  external_urls: {
    spotify: string
  }
}

interface TrackDisplay {
  id: string
  title: string
  duration: string
  image: string
  previewUrl: string | null
  spotifyUrl: string
  albumName: string
  hasCustomAudio?: boolean
}

interface SongOverride {
  audio_url: string | null
  cover_url: string | null
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000)
  const seconds = Math.floor((ms % 60000) / 1000)
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export default function MusicPage() {
  const [tracks, setTracks] = useState<TrackDisplay[]>([])
  const [currentTrack, setCurrentTrack] = useState<TrackDisplay | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both Spotify tracks and database overrides in parallel
        const [spotifyRes, overridesRes] = await Promise.all([
          fetch("/api/spotify"),
          fetch("/api/songs/overrides"),
        ])

        const spotifyData = await spotifyRes.json()
        const overridesData = await overridesRes.json()
        const overrides: Record<string, SongOverride> = overridesData.overrides || {}

        if (spotifyData.topTracks) {
          const formattedTracks: TrackDisplay[] = spotifyData.topTracks.map((track: SpotifyTrack) => {
            const override = overrides[track.id]
            return {
              id: track.id,
              title: track.name,
              duration: formatDuration(track.duration_ms),
              // Use custom cover if exists, otherwise Spotify album art
              image: override?.cover_url || track.album.images[0]?.url || "/placeholder.svg",
              // Use custom audio if exists, otherwise Spotify preview
              previewUrl: override?.audio_url || track.preview_url,
              spotifyUrl: track.external_urls.spotify,
              albumName: track.album.name,
              hasCustomAudio: !!override?.audio_url,
            }
          })
          setTracks(formattedTracks)
          setCurrentTrack(formattedTracks[0])
        }
      } catch (err) {
        console.error("Failed to fetch tracks:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-12">
        <h1 className="text-5xl md:text-6xl font-black mb-12 text-foreground tracking-tighter animate-fade-in-up">
          MUSIC DASHBOARD
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tracklist */}
          <div className="lg:col-span-2 animate-slide-in-left">
            <h2 className="text-2xl font-bold mb-6 text-primary">TOP TRACKS</h2>
            <div className="space-y-3">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  onClick={() => setCurrentTrack(track)}
                  className={`p-4 rounded-lg cursor-pointer transition-all duration-300 hover-lift ${
                    currentTrack?.id === track.id
                      ? "bg-primary/20 border border-primary shadow-[0_0_20px_rgba(255,23,68,0.2)]"
                      : "bg-card hover:bg-muted border border-transparent"
                  }`}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative group">
                      <img
                        src={track.image || "/placeholder.svg"}
                        alt={track.title}
                        className="w-12 h-12 rounded object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 rounded opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Play size={16} className="text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`font-semibold truncate ${currentTrack?.id === track.id ? "text-primary" : "text-foreground"}`}
                      >
                        {track.title}
                      </p>
                      <p className="text-sm text-muted-foreground">{track.albumName}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">{track.duration}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Now Playing */}
          {currentTrack && (
            <div className="bg-card rounded-lg p-6 h-fit sticky top-20 border border-border animate-slide-in-right hover:border-primary/50 transition-colors">
              <h3 className="text-lg font-bold text-primary mb-4">NOW PLAYING</h3>
              <div className="space-y-4">
                <div className="overflow-hidden rounded-lg">
                  <img
                    src={currentTrack.image || "/placeholder.svg"}
                    alt={currentTrack.title}
                    className="w-full aspect-square object-cover transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div>
                  <p className="text-foreground font-bold text-lg">{currentTrack.title}</p>
                  <p className="text-muted-foreground text-sm">{currentTrack.albumName}</p>
                  <p className="text-muted-foreground text-xs mt-1">{currentTrack.duration}</p>
                </div>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-full py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 hover-glow"
                >
                  {isPlaying ? (
                    <>
                      <Pause size={20} /> PAUSE
                    </>
                  ) : (
                    <>
                      <Play size={20} /> PLAY
                    </>
                  )}
                </button>
                <a
                  href={currentTrack.spotifyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  <ExternalLink size={14} />
                  Open in Spotify
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Newsletter Signup */}
        <div className="mt-16 bg-card border border-border rounded-lg p-8 md:p-12 text-center animate-fade-in-up">
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
