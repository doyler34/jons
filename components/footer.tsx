"use client"

import Link from "next/link"
import { useEffect, useState } from "react"

interface Settings {
  instagram_url?: string
  twitter_url?: string
  tiktok_url?: string
  youtube_url?: string
  spotify_url?: string
  apple_music_url?: string
  soundcloud_url?: string
  contact_email?: string
}

export default function Footer() {
  const [settings, setSettings] = useState<Settings>({})

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings")
        if (res.ok) {
          const data = await res.json()
          setSettings(data.settings || {})
        }
      } catch (error) {
        console.error("Failed to fetch settings:", error)
      }
    }

    fetchSettings()
  }, [])

  // Default to hardcoded values if settings not loaded
  const instagramUrl = settings.instagram_url || "https://www.instagram.com/jonspirit.mp4/"
  const youtubeUrl = settings.youtube_url || "https://www.youtube.com/@Jonspiritprime"
  const spotifyUrl = settings.spotify_url || "https://open.spotify.com/artist/2JvA93ASY6Tq4bISN2eh6Z"
  const contactEmail = settings.contact_email || "info@jonspirit.com"

  return (
    <footer className="bg-card border-t border-border py-8 md:py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-12 lg:px-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
          {/* Brand - Full width on mobile */}
          <div className="col-span-2 md:col-span-1 mb-4 md:mb-0">
            <h3 className="text-lg md:text-xl mb-2 md:mb-4 uppercase text-foreground" style={{ fontFamily: "'Clash Display', system-ui, sans-serif", fontWeight: 700, letterSpacing: "0.65px", lineHeight: 1.05 }}>JON SPIRIT</h3>
            <p className="text-muted-foreground text-xs md:text-sm">Underground hip-hop artist. Spectral & Gritty.</p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="font-bold mb-2 md:mb-4 text-foreground text-sm md:text-base">NAVIGATION</h4>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm text-muted-foreground">
              <li>
                <Link href="/" className="hover:text-primary transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/music" className="hover:text-primary transition">
                  Music
                </Link>
              </li>
              <li>
                <Link href="/events" className="hover:text-primary transition">
                  Events
                </Link>
              </li>
              <li>
                <Link href="/socials" className="hover:text-primary transition">
                  Socials
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h4 className="font-bold mb-2 md:mb-4 text-foreground text-sm md:text-base">CONNECT</h4>
            <ul className="space-y-1 md:space-y-2 text-xs md:text-sm text-muted-foreground">
              <li>
                <a href={`mailto:${contactEmail}`} className="hover:text-primary transition">
                  Email
                </a>
              </li>
              {instagramUrl && (
                <li>
                  <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
                    Instagram
                  </a>
                </li>
              )}
              {youtubeUrl && (
                <li>
                  <a href={youtubeUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
                    YouTube
                  </a>
                </li>
              )}
              {spotifyUrl && (
                <li>
                  <a href={spotifyUrl} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
                    Spotify
                  </a>
                </li>
              )}
              {settings.tiktok_url && (
                <li>
                  <a href={settings.tiktok_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
                    TikTok
                  </a>
                </li>
              )}
              {settings.twitter_url && (
                <li>
                  <a href={settings.twitter_url} target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
                    Twitter / X
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-2 md:col-span-1">
            <h4 className="font-bold mb-2 md:mb-4 text-foreground text-sm md:text-base">LEGAL</h4>
            <ul className="flex flex-wrap gap-x-4 gap-y-1 md:block md:space-y-2 text-xs md:text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-primary transition">
                  Privacy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="hover:text-primary transition">
                  Cookies
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary transition">
                  Terms
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-border pt-6 md:pt-8">
          <p className="text-center text-xs md:text-sm text-muted-foreground">© 2025 Jon Spirit. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
