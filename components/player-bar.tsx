"use client"

import { Play, Pause, SkipBack, SkipForward, Volume2 } from "lucide-react"
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
  onPrevious?: () => void
  onNext?: () => void
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return "0:00"
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
  const [isLoading, setIsLoading] = useState(false)
  const prevUrlRef = useRef<string | null>(null)

  // Create audio element once
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.volume = volume
    }

    const audio = audioRef.current

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }
    const handleEnded = () => {
      setIsPlaying(false)
      if (onNext) onNext()
    }
    const handleCanPlay = () => {
      setIsLoading(false)
    }
    const handleError = (e: Event) => {
      console.error("Audio error:", e)
      setIsLoading(false)
    }

    audio.addEventListener("timeupdate", handleTimeUpdate)
    audio.addEventListener("loadedmetadata", handleLoadedMetadata)
    audio.addEventListener("ended", handleEnded)
    audio.addEventListener("canplay", handleCanPlay)
    audio.addEventListener("error", handleError)

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate)
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
      audio.removeEventListener("ended", handleEnded)
      audio.removeEventListener("canplay", handleCanPlay)
      audio.removeEventListener("error", handleError)
      audio.pause()
    }
  }, [])

  // Handle track changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const url = currentTrack.previewUrl

    // If URL changed, load new track
    if (url && url !== prevUrlRef.current) {
      prevUrlRef.current = url
      setIsLoading(true)
      setCurrentTime(0)
      setDuration(0)
      audio.src = url
      audio.load()
      
      // If should be playing, play after a short delay to let it load
      if (isPlaying) {
        audio.play().catch(err => {
          console.error("Play failed:", err)
          setIsPlaying(false)
        })
      }
    }
  }, [currentTrack.previewUrl])

  // Handle play/pause
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack.previewUrl) return

    if (isPlaying) {
      audio.play().catch(err => {
        console.error("Play failed:", err)
        setIsPlaying(false)
      })
    } else {
      audio.pause()
    }
  }, [isPlaying, currentTrack.previewUrl])

  // Handle progress bar click for seeking
  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !progressRef.current || duration === 0) return
    
    const rect = progressRef.current.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const percentage = clickX / rect.width
    const newTime = percentage * duration
    
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }, [duration])

  // Handle volume change
  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }, [])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0
  const hasAudio = !!currentTrack.previewUrl

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
                {hasAudio ? (
                  <>
                    {formatTime(currentTime)} / {duration > 0 ? formatTime(duration) : currentTrack.duration}
                  </>
                ) : (
                  <span className="text-red-400">No audio available</span>
                )}
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
              onClick={() => hasAudio && setIsPlaying(!isPlaying)}
              disabled={!hasAudio || isLoading}
              className={`p-3 rounded-full transition-colors ${
                hasAudio 
                  ? "bg-primary hover:bg-primary/90" 
                  : "bg-muted cursor-not-allowed"
              }`}
              aria-label="Play/Pause"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : isPlaying ? (
                <Pause size={20} className="text-primary-foreground" fill="currentColor" />
              ) : (
                <Play size={20} className={hasAudio ? "text-primary-foreground" : "text-muted-foreground"} fill="currentColor" />
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
