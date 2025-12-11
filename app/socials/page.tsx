"use client"
import Navigation from "@/components/navigation"
import { Music, Instagram, Youtube, Cloud } from "lucide-react"

const socialLinks = [
  {
    name: "Spotify",
    description: "Stream all Jon Spirit tracks and playlists",
    icon: Music,
    color: "from-primary to-accent",
    href: "https://open.spotify.com/artist/2JvA93ASY6Tq4bISN2eh6Z",
  },
  {
    name: "Instagram",
    description: "Behind-the-scenes content and daily updates",
    icon: Instagram,
    color: "from-pink-500 to-accent",
    href: "https://www.instagram.com/jonspirit.mp4/",
  },
  {
    name: "YouTube",
    description: "Music videos and visual content",
    icon: Youtube,
    color: "from-red-600 to-red-500",
    href: "https://www.youtube.com/@Jonspiritprime",
  },
  {
    name: "SoundCloud",
    description: "Exclusive tracks and unreleased material",
    icon: Cloud,
    color: "from-orange-500 to-primary",
    href: "https://soundcloud.com/jonspirit",
  },
]

export default function SocialsPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-12">
        <h1 className="text-5xl md:text-6xl font-black mb-2 text-foreground tracking-tighter animate-fade-in-up">
          LINK IN BIO
        </h1>
        <p className="text-primary text-lg mb-12 font-semibold animate-fade-in-up stagger-2">
          Follow Jon Spirit on all platforms
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-2xl mx-auto">
          {socialLinks.map((social, index) => {
            const IconComponent = social.icon
            return (
              <a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`group rounded-lg p-8 bg-gradient-to-br ${social.color} hover:shadow-lg hover:shadow-primary/20 transition-all transform hover:scale-105 animate-fade-in-up`}
                style={{ animationDelay: `${index * 0.1}s`, opacity: 0 }}
              >
                <div className="flex flex-col items-center justify-center text-center space-y-4">
                  <div className="p-4 bg-background/30 rounded-lg group-hover:bg-background/50 transition-colors">
                    <IconComponent size={32} className="text-foreground" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground mb-2">{social.name}</h3>
                    <p className="text-sm text-foreground/80">{social.description}</p>
                  </div>
                </div>
              </a>
            )
          })}
        </div>

        <div className="mt-16 bg-card rounded-lg p-12 border border-border text-center max-w-2xl mx-auto animate-fade-in-up stagger-5">
          <h2 className="text-2xl font-bold text-foreground mb-4">JOIN THE SPIRIT REALM</h2>
          <p className="text-muted-foreground mb-6">
            Subscribe to Jon Spirit's mailing list for exclusive drops, behind-the-scenes content, and early access to
            new releases.
          </p>
          <a
            href="#"
            className="inline-block px-8 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-all duration-300 hover-glow"
          >
            SUBSCRIBE NOW
          </a>
        </div>
      </div>
    </div>
  )
}
