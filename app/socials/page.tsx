"use client"
import Navigation from "@/components/navigation"
import NewsletterForm from "@/components/newsletter-form"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { SpotifyLogo, InstagramLogo, YouTubeLogo, TikTokLogo, SoundCloudLogo } from "@/components/social-logos"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const socialLinks = [
  {
    name: "Instagram",
    description: "Behind-the-scenes & updates",
    icon: InstagramLogo,
    href: "/instagram",
    external: false,
  },
  {
    name: "YouTube",
    description: "Music videos & visual content",
    icon: YouTubeLogo,
    href: "https://www.youtube.com/@Jonspiritprime",
    external: true,
  },
  {
    name: "Spotify",
    description: "Stream all tracks and playlists",
    icon: SpotifyLogo,
    href: "https://open.spotify.com/artist/2JvA93ASY6Tq4bISN2eh6Z",
    external: true,
  },
  {
    name: "TikTok",
    description: "Short clips & viral content",
    icon: TikTokLogo,
    href: "https://www.tiktok.com/@jonspirit",
    external: true,
  },
  {
    name: "SoundCloud",
    description: "Exclusive & unreleased tracks",
    icon: SoundCloudLogo,
    href: "https://soundcloud.com/jonspirit",
    external: true,
  },
]

export default function SocialsPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-6 md:py-12">
        {/* Hero */}
        <section className="mb-8 md:mb-12">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/15 via-card to-card border border-border">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.16),transparent_55%)]" />
            <div className="relative p-6 md:p-10 lg:p-12">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-2 text-foreground tracking-tighter">
                CONNECT
              </h1>
              <p className="text-muted-foreground text-base md:text-lg max-w-2xl">
                Follow Jon Spirit across platforms for drops, behind-the-scenes, and new visuals.
              </p>
            </div>
          </div>
        </section>

        {/* Links */}
        <section className="mb-10 md:mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {socialLinks.map((social) => {
              const Icon = social.icon
              const cta = social.external ? (
                <a href={social.href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${social.name}`}>
                  Open {social.name}
                </a>
              ) : (
                <Link href={social.href} aria-label={`Open ${social.name}`}>
                  Open {social.name}
                </Link>
              )

              return (
                <Card
                  key={social.name}
                  className="group relative overflow-hidden rounded-2xl border-border bg-card/80 py-0 transition-colors hover:border-primary/40"
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(220,38,38,0.16),transparent_55%)] opacity-50 transition-opacity group-hover:opacity-100" />
                  <CardContent className="relative p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="rounded-2xl bg-primary/10 ring-1 ring-primary/15 p-3 text-primary">
                          <Icon size={28} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-foreground">{social.name}</h2>
                            {social.external && (
                              <span className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
                                External
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{social.description}</p>
                        </div>
                      </div>

                      <ArrowUpRight className="size-5 text-muted-foreground transition-colors group-hover:text-primary" />
                    </div>

                    <div className="mt-5">
                      <Button asChild className="rounded-full">
                        {cta}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Newsletter */}
        <section>
          <div className="relative overflow-hidden rounded-2xl bg-card border border-border p-6 md:p-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(220,38,38,0.18),transparent_55%)]" />
            <div className="relative">
              <h2 className="text-2xl md:text-3xl font-black text-foreground mb-3 tracking-tight">
                JOIN THE SPIRIT REALM
              </h2>
              <p className="text-muted-foreground mb-6 max-w-2xl">
                Get emails for exclusive drops, behind-the-scenes, and early access to new releases.
              </p>
              <NewsletterForm />
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
