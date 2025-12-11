"use client"

import { Play, Pause, SkipBack, SkipForward } from "lucide-react"
import { useRef, useEffect } from "react"

interface PlayerBarProps {
  currentTrack: {
    title: string
    duration: string
    image?: string
    previewUrl?: string | null
  }
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
}

export default function PlayerBar({ currentTrack, isPlaying, setIsPlaying }: PlayerBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (currentTrack.previewUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(currentTrack.previewUrl)
        audioRef.current.volume = 0.5
      } else if (audioRef.current.src !== currentTrack.previewUrl) {
        audioRef.current.src = currentTrack.previewUrl
      }

      if (isPlaying) {
        audioRef.current.play().catch(console.error)
      } else {
        audioRef.current.pause()
      }
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentTrack.previewUrl])

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <div className="h-1 bg-muted">
          <div className="h-full bg-primary w-1/3"></div>
        </div>

        {/* Player Controls */}
        <div className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {currentTrack.image && (
              <img
                src={currentTrack.image || "/placeholder.svg"}
                alt={currentTrack.title}
                className="w-10 h-10 rounded object-cover"
              />
            )}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
                aria-label="Play/Pause"
              >
                {isPlaying ? <Pause size={20} className="text-primary" /> : <Play size={20} className="text-primary" />}
              </button>
              <button className="p-2 hover:bg-muted rounded-full transition-colors" aria-label="Previous track">
                <SkipBack size={20} className="text-muted-foreground" />
              </button>
              <button className="p-2 hover:bg-muted rounded-full transition-colors" aria-label="Next track">
                <SkipForward size={20} className="text-muted-foreground" />
              </button>
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-foreground truncate">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground">{currentTrack.duration}</p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground ml-4">JON SPIRIT</div>
        </div>
      </div>
    </div>
  )
}
