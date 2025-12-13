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

export default function PlayerBar({ currentTrack, isPlaying, setIsPlaying, onPrevious, onNext }: PlayerBarProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying && currentTrack.previewUrl) {
      audio.play().catch(console.error)
    } else {
      audio.pause()
    }
  }, [isPlaying, currentTrack.previewUrl])

  // Reset when track changes
  useEffect(() => {
    setCurrentTime(0)
    setDuration(0)
  }, [currentTrack.previewUrl])

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    if (onNext) onNext()
  }

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = e.currentTarget
    const rect = bar.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    if (audioRef.current && duration > 0) {
      audioRef.current.currentTime = percent * duration
    }
  }

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec)) return "0:00"
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40">
      {/* Hidden audio element */}
      {currentTrack.previewUrl && (
        <audio
          ref={audioRef}
          src={currentTrack.previewUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          preload="auto"
        />
      )}

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        {/* Progress Bar */}
        <div 
          onClick={handleSeek}
          className="h-1 bg-muted cursor-pointer"
        >
          <div 
            className="h-full bg-primary"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="py-3 flex items-center justify-between gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {currentTrack.image && (
              <img
                src={currentTrack.image}
                alt={currentTrack.title}
                className="w-12 h-12 rounded object-cover"
              />
            )}
            <div className="truncate">
              <p className="text-sm font-semibold text-foreground truncate">{currentTrack.title}</p>
              <p className="text-xs text-muted-foreground">
                {formatTime(currentTime)} / {formatTime(duration) || currentTrack.duration}
              </p>
            </div>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <button 
              onClick={onPrevious}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <SkipBack size={20} className="text-foreground" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-3 bg-primary hover:bg-primary/90 rounded-full transition-colors"
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
            >
              <SkipForward size={20} className="text-foreground" />
            </button>
          </div>

          {/* Spacer */}
          <div className="hidden md:block flex-1" />
        </div>
      </div>
    </div>
  )
}
