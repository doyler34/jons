import { Youtube, Instagram, Music } from "lucide-react"
import Link from "next/link"

export default function FooterSection() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-[#2a2a2a] py-12 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {/* Branding */}
          <div>
            <h3 className="text-2xl font-black text-white mb-4">JON SPIRIT</h3>
            <p className="text-gray-400">Underground hip-hop. Spectral & Gritty.</p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-white font-bold mb-4">STREAM</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://open.spotify.com/artist/2JvA93ASY6Tq4bISN2eh6Z"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-cyan-400 transition-colors duration-300 flex items-center gap-2"
                >
                  <Music className="w-4 h-4" />
                  Spotify
                </a>
              </li>
              <li>
                <a
                  href="https://www.youtube.com/@Jonspiritprime"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-red-500 transition-colors duration-300 flex items-center gap-2"
                >
                  <Youtube className="w-4 h-4" />
                  YouTube
                </a>
              </li>
              <li>
                <a 
                  href="https://soundcloud.com/jonspirit" 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-orange-500 transition-colors duration-300"
                >
                  SoundCloud
                </a>
              </li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <h4 className="text-white font-bold mb-4">CONNECT</h4>
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/jonspirit.mp4/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#1a1a1a] rounded flex items-center justify-center text-gray-400 hover:bg-pink-600 hover:text-white transition-all duration-300"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://www.youtube.com/@Jonspiritprime"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#1a1a1a] rounded flex items-center justify-center text-gray-400 hover:bg-red-600 hover:text-white transition-all duration-300"
              >
                <Youtube className="w-5 h-5" />
              </a>
              <a
                href="https://open.spotify.com/artist/2JvA93ASY6Tq4bISN2eh6Z"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#1a1a1a] rounded flex items-center justify-center text-gray-400 hover:bg-green-500 hover:text-black transition-all duration-300"
              >
                <Music className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-[#2a2a2a] pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm font-mono">&copy; 2025 JON SPIRIT. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Privacy
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Terms
            </Link>
            <Link href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
