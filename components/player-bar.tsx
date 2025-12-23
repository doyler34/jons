"use client"

import Image from "next/image"
import { Play, Pause, SkipBack, SkipForward } from "lucide-react"
import { useRef, useEffect, useState, useCallback } from "react"

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
  const progressRef = useRef<HTMLDivElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Create audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.volume = 0.5
      
      // Add event listeners
      audioRef.current.addEventListener("timeupdate", () => {
        setCurrentTime(audioRef.current?.currentTime || 0)
      })
      audioRef.current.addEventListener("loadedmetadata", () => {
        setDuration(audioRef.current?.duration || 0)
      })
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false)
      })
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [setIsPlaying])

  // Handle track changes
  useEffect(() => {
    if (audioRef.current && currentTrack.previewUrl) {
      if (audioRef.current.src !== currentTrack.previewUrl) {
        audioRef.current.src = currentTrack.previewUrl
        audioRef.current.load()
        setCurrentTime(0)
        setDuration(0)
      }
    }
  }, [currentTrack.previewUrl])

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current && currentTrack.previewUrl) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error)
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentTrack.previewUrl])

  // Media Session API for iOS/Android control center
  useEffect(() => {
    if ("mediaSession" in navigator && currentTrack.title) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: "Jon Spirit",
        album: "Jon Spirit",
        artwork: currentTrack.image ? [
          { src: currentTrack.image, sizes: "512x512", type: "image/jpeg" }
        ] : []
      })

      navigator.mediaSession.setActionHandler("play", () => setIsPlaying(true))
      navigator.mediaSession.setActionHandler("pause", () => setIsPlaying(false))
      navigator.mediaSession.setActionHandler("seekbackward", skipBackward)
      navigator.mediaSession.setActionHandler("seekforward", skipForward)
    }
  }, [currentTrack.title, currentTrack.image, setIsPlaying])

  // Format time as m:ss
  const formatTime = useCallback((time: number) => {
    if (!time || isNaN(time)) return "0:00"
    const mins = Math.floor(time / 60)
    const secs = Math.floor(time % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }, [])

  // Seek to position when clicking progress bar
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current || !duration) return
    const rect = progressRef.current.getBoundingClientRect()
    const percent = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = percent * duration
    audioRef.current.currentTime = newTime
  }

  // Skip forward/back 10 seconds
  const skipBackward = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
  }

  const skipForward = () => {
    if (!audioRef.current) return
    audioRef.current.currentTime = Math.min(duration || 999, audioRef.current.currentTime + 10)
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        {/* Progress Bar - Clickable */}
        <div 
          ref={progressRef}
          onClick={handleSeek}
          className="h-1 bg-muted cursor-pointer group"
        >
          <div 
            className="h-full bg-primary relative"
            style={{ width: `${progress}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Player Controls */}
        <div className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            {currentTrack.image && (
              <Image
                src={currentTrack.image || "/placeholder.svg"}
                alt={currentTrack.title}
                width={40}
                height={40}
                className="w-10 h-10 rounded object-cover"
              />
            )}
            <div className="flex items-center gap-1">
              <button 
                onClick={skipBackward}
                className="p-2 hover:bg-muted rounded-full transition-colors" 
                aria-label="Skip back 10 seconds"
              >
                <SkipBack size={18} className="text-muted-foreground hover:text-foreground" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="p-2 hover:bg-muted rounded-full transition-colors"
                aria-label="Play/Pause"
              >
                {isPlaying ? <Pause size={22} className="text-primary" /> : <Play size={22} className="text-primary" />}
              </button>
              <button 
                onClick={skipForward}
                className="p-2 hover:bg-muted rounded-full transition-colors" 
                aria-label="Skip forward 10 seconds"
              >
                <SkipForward size={18} className="text-muted-foreground hover:text-foreground" />
              </button>
            </div>
            <div className="truncate">
              <p className="text-sm font-semibold text-foreground truncate">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : currentTrack.duration}
              </p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground ml-4">JON SPIRIT</div>
        </div>
      </div>
    </div>
  )
}
