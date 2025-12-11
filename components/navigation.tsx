"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"
import { useState } from "react"

export default function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/music", label: "Music" },
    { href: "/socials", label: "Socials" },
    { href: "/contact", label: "Contact" },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <nav className="sticky top-0 z-50 bg-background/80 border-b border-border backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-16">
        <div className="flex items-center justify-between h-16">
          <Link
            href="/"
            className="text-lg md:text-xl uppercase hover:text-primary transition-all duration-300 hover:drop-shadow-[0_0_10px_var(--primary)]"
            style={{ fontFamily: "'Clash Display', system-ui, sans-serif", fontWeight: 700, letterSpacing: "0.65px", lineHeight: 1.05, color: "#d8d0bf" }}
          >
            JON SPIRIT
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold tracking-wide transition-all duration-300 relative ${
                  isActive(link.href)
                    ? "text-primary drop-shadow-[0_0_10px_var(--primary)]"
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-primary rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-muted-foreground hover:text-primary transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden pb-4 flex flex-col gap-4 border-t border-border animate-fade-in-up">
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-semibold tracking-wide transition-colors py-2 ${
                  isActive(link.href) ? "text-primary" : "text-muted-foreground hover:text-primary"
                }`}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  )
}
