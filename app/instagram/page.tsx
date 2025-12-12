"use client"
import Navigation from "@/components/navigation"

export default function InstagramPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-8 md:py-12">
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-2 text-foreground tracking-tighter">
          INSTAGRAM
        </h1>
        <p className="text-primary text-base md:text-lg mb-8 md:mb-12 font-semibold">
          @jonspirit.mp4
        </p>

        <div className="flex justify-center">
          <iframe 
            src="https://snapwidget.com/embed/1114474" 
            className="snapwidget-widget" 
            allowTransparency={true}
            frameBorder={0} 
            scrolling="no" 
            style={{
              border: "none", 
              overflow: "hidden", 
              borderRadius: "5px", 
              width: "100%",
              maxWidth: "500px",
              height: "800px"
            }} 
            title="Posts from Instagram"
          />
        </div>

        <div className="mt-8 text-center">
          <a
            href="https://www.instagram.com/jonspirit.mp4/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 md:px-8 py-3 bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 hover:opacity-90 text-white font-bold rounded-lg transition-all duration-300 text-sm md:text-base"
          >
            FOLLOW ON INSTAGRAM
          </a>
        </div>
      </div>
    </div>
  )
}

