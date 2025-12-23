"use client"
import Navigation from "@/components/navigation"
import Link from "next/link"
import { SpotifyLogo, AppleMusicLogo, InstagramLogo, YouTubeLogo, TikTokLogo, SoundCloudLogo } from "@/components/social-logos"

const socialLinks = [
  {
    name: "Spotify",
    description: "Stream all tracks and playlists",
    icon: SpotifyLogo,
    bgColor: "bg-[#1DB954]",
    href: "https://open.spotify.com/artist/2JvA93ASY6Tq4bISN2eh6Z",
    external: true,
  },
  {
    name: "Apple Music",
    description: "Stream on Apple Music",
    icon: AppleMusicLogo,
    bgColor: "bg-gradient-to-br from-[#FA243C] to-[#FA57A0]",
    href: "https://music.apple.com/artist/jonspirit",
    external: true,
  },
  {
    name: "Instagram",
    description: "Behind-the-scenes & updates",
    icon: InstagramLogo,
    bgColor: "bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400",
    href: "/instagram",
    external: false,
  },
  {
    name: "YouTube",
    description: "Music videos & visual content",
    icon: YouTubeLogo,
    bgColor: "bg-[#FF0000]",
    href: "https://www.youtube.com/@Jonspiritprime",
    external: true,
  },
  {
    name: "TikTok",
    description: "Short clips & viral content",
    icon: TikTokLogo,
    bgColor: "bg-gradient-to-br from-[#00F2EA] via-[#FF0050] to-black",
    href: "https://www.tiktok.com/@jonspirit",
    external: true,
  },
  {
    name: "SoundCloud",
    description: "Exclusive & unreleased tracks",
    icon: SoundCloudLogo,
    bgColor: "bg-[#FF5500]",
    href: "https://soundcloud.com/jonspirit",
    external: true,
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

        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 md:gap-6 max-w-2xl mx-auto">
          {socialLinks.map((social, index) => {
            const IconComponent = social.icon
            const cardContent = (
              <div className="flex flex-col items-center justify-center text-center space-y-2 md:space-y-4">
                <div className="p-3 md:p-4 bg-black/20 rounded-xl group-hover:bg-black/30 transition-colors">
                  <IconComponent size={32} className="text-white w-8 h-8 md:w-10 md:h-10" />
                </div>
                <div>
                  <h3 className="text-sm md:text-xl font-bold text-white mb-1">{social.name}</h3>
                  <p className="text-xs md:text-sm text-white/80 hidden md:block">{social.description}</p>
                </div>
              </div>
            )
            const cardClass = `group rounded-xl p-4 md:p-8 ${social.bgColor} hover:shadow-lg hover:shadow-white/10 transition-all transform hover:scale-105 active:scale-95`
            
            return social.external ? (
              <a
                key={index}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cardClass}
              >
                {cardContent}
              </a>
            ) : (
              <Link
                key={index}
                href={social.href}
                className={cardClass}
              >
                {cardContent}
              </Link>
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
