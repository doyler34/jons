"use client"

import { useState } from "react"
import { Play, Pause } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

interface TrackCardProps {
  title: string
  duration: string
  image: string
}

export default function TrackCard({ title, duration, image }: TrackCardProps) {
  const [isPlaying, setIsPlaying] = useState(false)

  return (
    <Card className="bg-[#1a1a1a] border-[#2a2a2a] overflow-hidden group hover:border-purple-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/30">
      <CardContent className="p-0">
        {/* Image Container */}
        <div className="relative w-full aspect-square overflow-hidden">
          <img
            src={image || "/placeholder.svg"}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />

          {/* Play Button Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="bg-purple-600 hover:bg-purple-700 rounded-full p-4 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50"
            >
              {isPlaying ? <Pause className="w-8 h-8 text-white" /> : <Play className="w-8 h-8 text-white ml-1" />}
            </button>
          </div>
        </div>

        {/* Track Info */}
        <div className="p-4">
          <h3 className="font-bold text-white text-lg group-hover:text-purple-400 transition-colors duration-300">
            {title}
          </h3>
          <p className="text-gray-400 text-sm font-mono mt-2">{duration}</p>

          {/* Progress Bar */}
          <div className="mt-4 w-full bg-[#2a2a2a] rounded-full h-1 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-cyan-400 h-full w-0 group-hover:w-1/3 transition-all duration-300"></div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
