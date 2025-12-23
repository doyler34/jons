"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useEffect, useState } from "react"

interface HeroSectionProps {
  onPlay?: () => void
  artistImage?: string
  trackName?: string
}

export default function HeroSection({ onPlay, artistImage, trackName = "LATEST TRACK" }: HeroSectionProps) {
  const backgroundImage = artistImage || null
  const [imageLoaded, setImageLoaded] = useState(false)

  useEffect(() => {
    if (!backgroundImage) {
      setImageLoaded(true)
      return
    }
    const img = new Image()
    img.src = backgroundImage
    img.onload = () => {
      setImageLoaded(true)
    }
    img.onerror = () => {
      // If image fails to load, still show the section
      setImageLoaded(true)
    }
  }, [backgroundImage])

  return (
    <section
      className={`relative min-h-[60vh] md:min-h-[calc(100vh-64px)] w-full flex items-center justify-center overflow-hidden bg-cover bg-center transition-opacity duration-1000 ${
        imageLoaded ? "opacity-100" : "opacity-0"
      }`}
      style={{
        backgroundImage: backgroundImage ? `linear-gradient(rgba(10, 10, 10, 0.75), rgba(10, 10, 10, 0.75)), url('${backgroundImage}')` : 'linear-gradient(rgba(10, 10, 10, 0.95), rgba(10, 10, 10, 0.95))',
      }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-4xl overflow-visible">
        <h1
          className={`text-4xl sm:text-5xl md:text-7xl lg:text-8xl mb-6 md:mb-8 overflow-visible py-2 md:py-4 uppercase ${
            imageLoaded ? "animate-write-on" : "opacity-0"
          }`}
          style={{
            fontFamily: "'Clash Display', system-ui, sans-serif",
            fontWeight: 700,
            letterSpacing: "0.65px",
            lineHeight: 1.05,
            color: "#d8d0bf",
          }}
        >
          JON SPIRIT
        </h1>

        <div className={`flex flex-col sm:flex-row gap-3 md:gap-4 justify-center px-4 ${
          imageLoaded ? "animate-fade-in-up stagger-2" : "opacity-0"
        }`}>
          <Button
            onClick={onPlay}
            className="px-5 py-3 md:px-6 md:py-4 text-xs md:text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover-glow animate-pulse-glow tracking-wide"
          >
            STREAM {trackName.toUpperCase()}
          </Button>
          <Link href="/music">
            <Button
              variant="outline"
              className="px-5 py-3 md:px-6 md:py-4 text-xs md:text-sm font-semibold border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300 bg-transparent w-full hover-lift tracking-wide"
            >
              EXPLORE MUSIC
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
