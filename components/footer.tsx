import Link from "next/link"

export default function Footer() {
  return (
    <footer className="bg-card border-t border-border py-8 md:py-16">
      <div className="max-w-7xl mx-auto px-4 md:px-12 lg:px-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
          {/* Brand - Full width on mobile */}
          <div className="col-span-2 md:col-span-1 mb-4 md:mb-0">
            <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-4 tracking-wide">JON SPIRIT</h3>
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
                <a href="mailto:info@jonspirit.com" className="hover:text-primary transition">
                  Email
                </a>
              </li>
              <li>
                <a href="https://www.instagram.com/jonspirit.mp4/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
                  Instagram
                </a>
              </li>
              <li>
                <a href="https://www.youtube.com/@Jonspiritprime" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
                  YouTube
                </a>
              </li>
              <li>
                <a href="https://open.spotify.com/artist/2JvA93ASY6Tq4bISN2eh6Z" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition">
                  Spotify
                </a>
              </li>
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
