"use client"
import Navigation from "@/components/navigation"
import { Music, Instagram, Youtube, Cloud } from "lucide-react"

const socialLinks = [
  {
    name: "Spotify",
    description: "Stream all tracks and playlists",
    icon: Music,
    bgColor: "bg-[#1DB954]",
    href: "https://open.spotify.com/artist/2JvA93ASY6Tq4bISN2eh6Z",
  },
  {
    name: "Instagram",
    description: "Behind-the-scenes & updates",
    icon: Instagram,
    bgColor: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
    href: "https://www.instagram.com/jonspirit.mp4/",
  },
  {
    name: "YouTube",
    description: "Music videos & visual content",
    icon: Youtube,
    bgColor: "bg-[#FF0000]",
    href: "https://www.youtube.com/@Jonspiritprime",
  },
  {
    name: "SoundCloud",
    description: "Exclusive & unreleased tracks",
    icon: Cloud,
    bgColor: "bg-[#FF5500]",
    href: "https://soundcloud.com/jonspirit",
  },
]

export default function SocialsPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-8 md:py-12">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-2 text-foreground tracking-tighter">
          LINK IN BIO
        </h1>
        <p className="text-primary text-base md:text-lg mb-8 md:mb-12 font-semibold">
          Follow Jon Spirit on all platforms
        </p>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-6 max-w-2xl mx-auto">
          {socialLinks.map((social, index) => {
            const IconComponent = social.icon
            return (
              <a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group rounded-xl p-4 md:p-8 ${social.bgColor} hover:shadow-lg hover:shadow-white/10 transition-all transform hover:scale-105 active:scale-95`}
              >
                <div className="flex flex-col items-center justify-center text-center space-y-2 md:space-y-4">
                  <div className="p-3 md:p-4 bg-black/20 rounded-xl group-hover:bg-black/30 transition-colors">
                    <IconComponent size={24} className="md:w-8 md:h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm md:text-xl font-bold text-white mb-1">{social.name}</h3>
                    <p className="text-xs md:text-sm text-white/80 hidden md:block">{social.description}</p>
                  </div>
                </div>
              </a>
            )
          })}
        </div>

        <div className="mt-10 md:mt-16 bg-card rounded-xl p-6 md:p-12 border border-border text-center max-w-2xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3 md:mb-4">JOIN THE SPIRIT REALM</h2>
          <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
            Subscribe for exclusive drops and early access to new releases.
          </p>
          <a
            href="/contact"
            className="inline-block px-6 md:px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-all duration-300 text-sm md:text-base"
          >
            GET IN TOUCH
          </a>
        </div>
      </div>
    </div>
  )
}
