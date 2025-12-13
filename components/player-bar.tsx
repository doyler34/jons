"use client"

import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react"
import { useRef, useEffect, useState } from "react"

interface PlayerBarProps {
  currentTrack: {
    title: string
    duration: string
    image?: string
    previewUrl?: string | null
  }
  isPlaying: boolean
  setIsPlaying: (playing: boolean) => void
  onPrevious?: () => void
  onNext?: () => void
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export default function PlayerBar({ currentTrack, isPlaying, setIsPlaying, onPrevious, onNext }: PlayerBarProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const progressRef = useRef<HTMLDivElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.5)

  useEffect(() => {
    if (currentTrack.previewUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(currentTrack.previewUrl)
        audioRef.current.volume = volume
        
        // Set up event listeners
        audioRef.current.addEventListener("timeupdate", () => {
          setCurrentTime(audioRef.current?.currentTime || 0)
        })
        audioRef.current.addEventListener("loadedmetadata", () => {
          setDuration(audioRef.current?.duration || 0)
        })
        audioRef.current.addEventListener("ended", () => {
          setIsPlaying(false)
          if (onNext) onNext()
        })
      } else if (audioRef.current.src !== currentTrack.previewUrl) {
        audioRef.current.src = currentTrack.previewUrl
        audioRef.current.load()
        setCurrentTime(0)
      }

      if (isPlaying) {
        audioRef.current.play().catch(console.error)
      } else {
        audioRef.current.pause()
      }
    }

    return () => {
      // Don't destroy audio on every render, just pause
    }
  }, [isPlaying, currentTrack.previewUrl])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  // Handle progress bar click for seeking
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current) return
    
    const rect = progressRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * duration
    
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        {/* Progress Bar - Clickable */}
        <div 
          ref={progressRef}
          onClick={handleProgressClick}
          className="h-1 bg-muted cursor-pointer group"
        >
          <div 
            className="h-full bg-primary relative transition-all"
            style={{ width: `${progress}%` }}
          >
            {/* Scrubber dot on hover */}
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>

        {/* Player Controls */}
        <div className="py-3 flex items-center justify-between gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {currentTrack.image && (
              <img
                src={currentTrack.image || "/placeholder.svg"}
                alt={currentTrack.title}
                className="w-12 h-12 rounded object-cover shadow-md"
              />
            )}
            <div className="truncate">
              <p className="text-sm font-semibold text-foreground truncate">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : currentTrack.duration}
              </p>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={onPrevious}
              className="p-2 hover:bg-muted rounded-full transition-colors"
              aria-label="Previous track"
            >
              <SkipBack size={20} className="text-foreground" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 bg-primary hover:bg-primary/90 rounded-full transition-colors"
              aria-label="Play/Pause"
            >
              {isPlaying ? (
                <Pause size={20} className="text-primary-foreground" fill="currentColor" />
              ) : (
                <Play size={20} className="text-primary-foreground ml-0.5" fill="currentColor" />
              )}
            </button>
            <button 
              onClick={onNext}
              className="p-2 hover:bg-muted rounded-full transition-colors"
              aria-label="Next track"
            >
              <SkipForward size={20} className="text-foreground" />
            </button>
          </div>

          {/* Volume Control */}
          <div className="hidden md:flex items-center gap-2 flex-1 justify-end">
            <Volume2 size={18} className="text-muted-foreground" />
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-1 bg-muted rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
