import type React from "react"
import type { Metadata } from "next"
import { Montserrat, Poppins } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import Footer from "@/components/footer"
import CookieConsent from "@/components/cookie-consent"
import CookieResetButton from "@/components/cookie-reset-button"
import "./globals.css"

const montserrat = Montserrat({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800", "900"] })
const poppins = Poppins({ subsets: ["latin"], weight: ["600", "700", "800", "900"], variable: "--font-poppins" })

export const metadata: Metadata = {
  title: "JON SPIRIT - Underground Hip-Hop Artist",
  description: "Stream FEASTAHZ and more from Jon Spirit. High-energy underground hip-hop.",
  generator: "v0.app",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://i.scdn.co" />
        <link rel="preconnect" href="https://cdn.fontshare.com" />
        <link rel="dns-prefetch" href="https://i.scdn.co" />
        <link rel="dns-prefetch" href="https://cdn.fontshare.com" />
        
        <link
          rel="preload"
          href="/fonts/EagleHorizonP.ttf"
          as="font"
          type="font/ttf"
          crossOrigin="anonymous"
        />
        <link href="https://api.fontshare.com/v2/css?f[]=clash-display@700&display=swap" rel="stylesheet" />
        
        {/* Preload critical hero image */}
        <link rel="preload" href="/jon-spirit-banner.jpg" as="image" fetchPriority="high" />
      </head>
      <body className={`${montserrat.className} ${poppins.variable} antialiased bg-[#0a0a0a] text-white`}>
        {children}
        <Footer />
        <CookieConsent />
        <CookieResetButton />
        <Analytics />
      </body>
    </html>
  )
}
