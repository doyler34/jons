"use client"
import { useState, useEffect } from "react"
import Navigation from "@/components/navigation"
import HeroSection from "@/components/hero-section"
import PlayerBar from "@/components/player-bar"
import { ExternalLink } from "lucide-react"

interface SpotifyTrack {
  id: string
  name: string
  duration_ms: number
  preview_url: string | null
  album: {
    images: { url: string }[]
  }
}

interface SpotifyData {
  artist: {
    name: string
    images: { url: string }[]
    followers: { total: number }
    genres: string[]
  }
  topTracks: SpotifyTrack[]
  albums: { id: string }[]
}

function formatFollowers(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`
  }
  return count.toString()
}

export default function Home() {
  const [spotifyData, setSpotifyData] = useState<SpotifyData | null>(null)
  const [currentTrack, setCurrentTrack] = useState<{
    title: string
    duration: string
    image?: string
    previewUrl?: string | null
  } | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPlayer, setShowPlayer] = useState(false)

  useEffect(() => {
    fetch("/api/spotify")
      .then((res) => res.json())
      .then((data) => {
        setSpotifyData(data)
        if (data.topTracks?.[0]) {
          const track = data.topTracks[0]
          setCurrentTrack({
            title: track.name,
            duration: formatDuration(track.duration_ms),
            image: track.album.images[0]?.url,
            previewUrl: track.preview_url,
          })
        }
      })
      .catch(console.error)
  }, [])

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, "0")}`
  }

  const handlePlay = () => {
    setShowPlayer(true)
    setIsPlaying(true)
  }

  // Get first track name for the hero button
  const firstTrackName = spotifyData?.topTracks?.[0]?.name || "LATEST TRACK"

  const stats = spotifyData
    ? [
        { label: "Followers", value: formatFollowers(spotifyData.artist.followers.total) },
        { label: "Top Tracks", value: spotifyData.topTracks.length.toString() },
        { label: "Releases", value: spotifyData.albums?.length?.toString() || "0" },
      ]
    : []

  const genres = spotifyData?.artist?.genres || []
  const artistImage = spotifyData?.artist?.images?.[0]?.url

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <HeroSection onPlay={handlePlay} artistImage={artistImage} trackName={firstTrackName} />

      {/* About Section */}
      <section id="about" className="w-full px-6 md:px-12 lg:px-16 py-20 lg:py-32">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-5xl md:text-6xl font-black mb-4 text-foreground tracking-tighter animate-fade-in-up">
            THE SPIRIT REALM
          </h2>
          <p className="text-primary text-lg mb-16 font-semibold animate-fade-in-up stagger-2">
            Underground. Spectral. Gritty.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Left Column: Image & Origin Story */}
          <div className="space-y-8 animate-slide-in-left">
            {artistImage && (
              <div className="rounded-xl overflow-hidden border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,23,68,0.2)]">
                <img
                  src={artistImage}
                  alt="Jon Spirit"
                  className="w-full aspect-square object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            )}

            <div className="bg-card rounded-xl p-8 border border-border hover-lift">
              <h3 className="text-2xl font-bold text-primary mb-6">ORIGIN STORY</h3>
              <p className="text-muted-foreground leading-relaxed mb-4 text-base">
                Jon Spirit emerged from the underground hip-hop scene with a mission to push boundaries and challenge
                conventions. With roots in experimental production and raw lyricism, he crafted a sound that's uniquely
                spectral and gritty.
              </p>
              <p className="text-muted-foreground leading-relaxed text-base">
                From the streets to the studio, Jon Spirit's journey is defined by authenticity, innovation, and an
                unwavering commitment to the underground movement. Each track is a spiritual journey into the depths of
                contemporary hip-hop.
              </p>
            </div>

            {genres.length > 0 && (
              <div className="bg-card rounded-xl p-8 border border-border hover-lift">
                <h3 className="text-2xl font-bold text-primary mb-6">GENRES</h3>
                <div className="flex flex-wrap gap-3">
                  {genres.map((genre, index) => (
                    <span
                      key={index}
                      className="px-5 py-2.5 bg-primary/20 text-primary rounded-full text-sm font-medium capitalize hover:bg-primary hover:text-primary-foreground transition-all duration-300 cursor-default"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Stats & Connect */}
          <div className="space-y-6 animate-slide-in-right">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl p-8 border border-border hover:border-primary transition-all duration-300 hover-lift"
              >
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground font-semibold text-lg">{stat.label}</p>
                  <p className="text-3xl font-black text-primary">{stat.value}</p>
                </div>
              </div>
            ))}

            <div className="bg-card rounded-xl p-8 border border-border hover-lift">
              <h3 className="text-2xl font-bold text-accent mb-4">CONNECT WITH JON SPIRIT</h3>
              <p className="text-muted-foreground text-base leading-relaxed mb-6">
                Experience the spectral and gritty sound of Jon Spirit. Stream now on your favorite platform and join
                the Spirit Realm community.
              </p>
              <a
                href="https://open.spotify.com/artist/2JvA93ASY6Tq4bISN2eh6Z"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-all duration-300 hover-glow text-base"
              >
                <ExternalLink size={20} />
                OPEN ON SPOTIFY
              </a>
            </div>
          </div>
        </div>
        </div>
      </section>

      {showPlayer && currentTrack && (
        <PlayerBar currentTrack={currentTrack} isPlaying={isPlaying} setIsPlaying={setIsPlaying} />
      )}
    </div>
  )
}
