"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

export default function GallerySection() {
  const [currentIndex, setCurrentIndex] = useState(0)

  const images = [
    "/jon-spirit-banner.jpg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
    "/placeholder.svg",
  ]

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }

  return (
    <section className="py-20 px-4 md:px-8 lg:px-16 bg-[#0a0a0a]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold mb-12 text-white">VISUAL AESTHETIC</h2>

        {/* Carousel */}
        <div className="relative overflow-hidden rounded-lg mb-8">
          <div className="flex transition-transform duration-300 ease-out">
            <img
              src={images[currentIndex] || "/placeholder.svg"}
              alt={`Gallery ${currentIndex + 1}`}
              className="w-full h-96 object-cover"
            />
          </div>

          {/* Navigation Buttons */}
          <button
            onClick={prevImage}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 p-3 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 z-10"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-purple-600 hover:bg-purple-700 p-3 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 z-10"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>

          {/* Counter */}
          <div className="absolute bottom-4 right-4 bg-black/70 px-4 py-2 rounded text-gray-300 font-mono text-sm">
            {currentIndex + 1} / {images.length}
          </div>
        </div>

        {/* Thumbnail Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative aspect-square overflow-hidden rounded border-2 transition-all duration-300 ${
                idx === currentIndex
                  ? "border-purple-600 shadow-lg shadow-purple-500/50"
                  : "border-[#2a2a2a] hover:border-purple-600"
              }`}
            >
              <img
                src={img || "/placeholder.svg"}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  )
}
