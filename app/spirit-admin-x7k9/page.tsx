"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Upload, Music, Image, Check, X, Loader2, Mail, Users, RefreshCw, Search, Plus, Disc, Eye, EyeOff } from "lucide-react"

interface Subscriber {
  id: string
  email: string
  status: string
  created_at: string
}

interface SpotifyTrack {
  id: string
  name: string
  duration_ms: number
  preview_url: string | null
  album: {
    id: string
    name: string
    images: { url: string }[]
  }
}

interface SpotifyAlbum {
  id: string
  name: string
  images: { url: string }[]
  release_date: string
  tracks: SpotifyTrack[]
}

interface SongOverride {
  audio_url: string | null
  cover_url: string | null
  hidden?: boolean
}

interface ManualSong {
  id: string
  title: string
  album_name: string
  audio_url: string
  cover_url: string | null
  created_at: string
}

const EMOJI_LIST = ["🔥", "🎵", "🎤", "💿", "🎧", "⚡", "💀", "👻", "🖤", "❤️", "🚨", "📢", "🆕", "✨", "💯", "🙏"]

type TabType = "music" | "newsletter" | "subscribers"

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("music")
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Music management state
  const [albums, setAlbums] = useState<SpotifyAlbum[]>([])
  const [overrides, setOverrides] = useState<Record<string, SongOverride>>({})
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [uploadingFor, setUploadingFor] = useState<{ id: string; type: "audio" | "cover" } | null>(null)
  const [musicStatus, setMusicStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [lastMusicUpdate, setLastMusicUpdate] = useState<Date | null>(null)
  const [selectedFilter, setSelectedFilter] = useState<string>("all") // "all", "singles", or album id
  const [searchQuery, setSearchQuery] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [newSong, setNewSong] = useState({ title: "", albumName: "", audioFile: null as File | null, coverFile: null as File | null })
  const [uploadingNewSong, setUploadingNewSong] = useState(false)
  const [manualSongs, setManualSongs] = useState<ManualSong[]>([])
  const newSongAudioRef = useRef<HTMLInputElement>(null)
  const newSongCoverRef = useRef<HTMLInputElement>(null)

  // Subscribers state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null)
  const [loadingSubscribers, setLoadingSubscribers] = useState(false)

  // Newsletter state
  const [newsletterType, setNewsletterType] = useState<"poster" | "text">("poster")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [posterText, setPosterText] = useState("")
  const [posterUrl, setPosterUrl] = useState("")
  const [buttonText, setButtonText] = useState("LISTEN NOW")
  const [buttonLink, setButtonLink] = useState("https://jonspirit.com/music")
  const [showButton, setShowButton] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/auth")
      if (response.ok) {
        setAuthenticated(true)
        fetchMusic()
        fetchSubscribers()
        fetchManualSongs()
      } else {
        router.push("/spirit-admin-x7k9/login")
      }
    } catch {
      router.push("/spirit-admin-x7k9/login")
    }
  }

  // Fetch ALL songs from all albums
  const fetchMusic = async (forceRefresh = false) => {
    setLoadingTracks(true)
    setMusicStatus(null)
    try {
      // Add cache-busting param if force refresh
      const url = forceRefresh ? `/api/spotify?t=${Date.now()}` : "/api/spotify"
      const spotifyRes = await fetch(url, {
        cache: forceRefresh ? "no-store" : "default"
      })
      const spotifyData = await spotifyRes.json()
      
      // Use albumsWithTracks to get ALL songs
      if (spotifyData.albumsWithTracks && spotifyData.albumsWithTracks.length > 0) {
        setAlbums(spotifyData.albumsWithTracks)
      }

      // Fetch overrides from database
      const overridesRes = await fetch("/api/songs/overrides")
      const overridesData = await overridesRes.json()
      setOverrides(overridesData.overrides || {})
      
      setLastMusicUpdate(new Date())
      if (forceRefresh) {
        setMusicStatus({ type: "success", message: "Music library refreshed from Spotify!" })
      }
    } catch (error) {
      console.error("Failed to fetch music:", error)
      setMusicStatus({ type: "error", message: "Failed to fetch music" })
    } finally {
      setLoadingTracks(false)
    }
  }

  const handleMusicFileUpload = async (
    spotifyId: string,
    file: File,
    type: "audio" | "cover"
  ) => {
    setUploadingFor({ id: spotifyId, type })
    setMusicStatus(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        const errorData = await uploadRes.json()
        throw new Error(errorData.error || "Upload failed")
      }

      const { url } = await uploadRes.json()

      const saveRes = await fetch("/api/songs/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spotify_id: spotifyId,
          [type === "audio" ? "audio_url" : "cover_url"]: url,
        }),
      })

      if (!saveRes.ok) {
        throw new Error("Failed to save override")
      }

      setOverrides((prev) => ({
        ...prev,
        [spotifyId]: {
          ...prev[spotifyId],
          [type === "audio" ? "audio_url" : "cover_url"]: url,
        },
      }))

      setMusicStatus({ type: "success", message: `${type === "audio" ? "Audio" : "Cover"} uploaded!` })
    } catch (error) {
      console.error("Upload error:", error)
      setMusicStatus({ type: "error", message: error instanceof Error ? error.message : "Upload failed" })
    } finally {
      setUploadingFor(null)
    }
  }

  const removeOverride = async (spotifyId: string, field: "audio" | "cover") => {
    try {
      const res = await fetch(`/api/songs/overrides?spotify_id=${spotifyId}&field=${field}`, {
        method: "DELETE",
      })

      if (res.ok) {
        setOverrides((prev) => ({
          ...prev,
          [spotifyId]: {
            ...prev[spotifyId],
            [field === "audio" ? "audio_url" : "cover_url"]: null,
          },
        }))
        setMusicStatus({ type: "success", message: `${field === "audio" ? "Audio" : "Cover"} removed` })
      }
    } catch (error) {
      console.error("Remove error:", error)
    }
  }

  const toggleVisibility = async (spotifyId: string, currentHidden: boolean) => {
    try {
      const res = await fetch("/api/songs/overrides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spotify_id: spotifyId, hidden: !currentHidden }),
      })

      if (res.ok) {
        setOverrides((prev) => ({
          ...prev,
          [spotifyId]: {
            ...prev[spotifyId],
            audio_url: prev[spotifyId]?.audio_url || null,
            cover_url: prev[spotifyId]?.cover_url || null,
            hidden: !currentHidden,
          },
        }))
      }
    } catch (error) {
      console.error("Toggle visibility error:", error)
    }
  }

  const fetchSubscribers = async () => {
    setLoadingSubscribers(true)
    try {
      const response = await fetch("/api/admin/subscribers")
      if (response.ok) {
        const data = await response.json()
        setSubscribers(data.subscribers || [])
        setSubscriberCount(data.total || 0)
      }
    } catch (error) {
      console.error("Failed to fetch subscribers:", error)
    } finally {
      setLoadingSubscribers(false)
    }
  }

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" })
    router.push("/spirit-admin-x7k9/login")
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setSendStatus(null)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setPosterUrl(data.url)
        setSendStatus({ type: "success", message: "Image uploaded!" })
      } else {
        setSendStatus({ type: "error", message: data.error || "Upload failed" })
      }
    } catch {
      setSendStatus({ type: "error", message: "Upload failed" })
    } finally {
      setUploading(false)
    }
  }

  const clearImage = () => {
    setPosterUrl("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setSendStatus(null)
  }

  const addEmoji = (emoji: string) => {
    setSubject(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const addEmojiToContent = (emoji: string) => {
    setContent(prev => prev + emoji)
  }

  const sendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newsletterType === "poster" && (!subject.trim() || !posterUrl)) {
      setSendStatus({ type: "error", message: "Subject and poster image are required" })
      return
    }
    if (newsletterType === "text" && (!subject.trim() || !content.trim())) {
      setSendStatus({ type: "error", message: "Subject and content are required" })
      return
    }

    if (!confirm(`Send newsletter "${subject}" to all ${subscriberCount} subscribers?`)) {
      return
    }

    setSending(true)
    setSendStatus(null)

    const payload = {
      subject,
      type: newsletterType,
      posterUrl: newsletterType === "poster" ? posterUrl : undefined,
      posterText: newsletterType === "poster" && posterText.trim() ? posterText : undefined,
      content: newsletterType === "text" ? content : undefined,
      buttonText: showButton ? buttonText : undefined,
      buttonLink: showButton ? buttonLink : undefined,
    }

    try {
      const response = await fetch("/api/admin/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      let data
      try {
        data = await response.json()
      } catch {
        data = { message: "Newsletter scheduled!", error: "Could not parse response" }
      }

      if (response.ok) {
        setSendStatus({ type: "success", message: data.message || "Newsletter sent!" })
        setSubject("")
        setContent("")
        setPosterText("")
        setPosterUrl("")
        if (fileInputRef.current) fileInputRef.current.value = ""
      } else {
        setSendStatus({ type: "error", message: data.error || "Failed to send" })
      }
    } catch (err) {
      console.error("Newsletter send error:", err)
      setSendStatus({ type: "error", message: "Network error - please try again" })
    }
    
    setSending(false)
  }

  // Upload new manual song
  const handleNewSongUpload = async () => {
    if (!newSong.title || !newSong.audioFile) {
      setMusicStatus({ type: "error", message: "Title and audio file are required" })
      return
    }

    setUploadingNewSong(true)
    setMusicStatus(null)

    try {
      // Upload audio file
      const audioFormData = new FormData()
      audioFormData.append("file", newSong.audioFile)
      const audioRes = await fetch("/api/admin/upload", { method: "POST", body: audioFormData })
      if (!audioRes.ok) throw new Error("Failed to upload audio")
      const { url: audioUrl } = await audioRes.json()

      // Upload cover if provided
      let coverUrl = null
      if (newSong.coverFile) {
        const coverFormData = new FormData()
        coverFormData.append("file", newSong.coverFile)
        const coverRes = await fetch("/api/admin/upload", { method: "POST", body: coverFormData })
        if (coverRes.ok) {
          const { url } = await coverRes.json()
          coverUrl = url
        }
      }

      // Save to database
      const saveRes = await fetch("/api/songs/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newSong.title,
          album_name: newSong.albumName || "Singles",
          audio_url: audioUrl,
          cover_url: coverUrl,
        }),
      })

      if (!saveRes.ok) throw new Error("Failed to save song")
      
      const { song } = await saveRes.json()
      setManualSongs(prev => [song, ...prev])
      setMusicStatus({ type: "success", message: "Song uploaded successfully!" })
      setShowUploadModal(false)
      setNewSong({ title: "", albumName: "", audioFile: null, coverFile: null })
      if (newSongAudioRef.current) newSongAudioRef.current.value = ""
      if (newSongCoverRef.current) newSongCoverRef.current.value = ""
    } catch (error) {
      console.error("Upload error:", error)
      setMusicStatus({ type: "error", message: error instanceof Error ? error.message : "Upload failed" })
    } finally {
      setUploadingNewSong(false)
    }
  }

  // Fetch manual songs
  const fetchManualSongs = async () => {
    try {
      const res = await fetch("/api/songs/manual")
      if (res.ok) {
        const data = await res.json()
        setManualSongs(data.songs || [])
      }
    } catch (error) {
      console.error("Failed to fetch manual songs:", error)
    }
  }

  // Get singles (albums with only 1 track)
  const singles = albums.filter(a => a.tracks?.length === 1)
  const multiTrackAlbums = albums.filter(a => (a.tracks?.length || 0) > 1)

  // Get filtered tracks
  const getFilteredTracks = () => {
    let tracks: SpotifyTrack[] = []
    
    if (selectedFilter === "all") {
      tracks = albums.flatMap(a => a.tracks || [])
    } else if (selectedFilter === "singles") {
      tracks = singles.flatMap(a => a.tracks || [])
    } else if (selectedFilter === "manual") {
      // Return empty for spotify tracks, manual songs handled separately
      return []
    } else {
      const album = albums.find(a => a.id === selectedFilter)
      tracks = album?.tracks || []
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      tracks = tracks.filter(t => 
        t.name.toLowerCase().includes(query) || 
        t.album.name.toLowerCase().includes(query)
      )
    }

    return tracks
  }

  const filteredTracks = getFilteredTracks()
  const filteredManualSongs = searchQuery.trim() 
    ? manualSongs.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.album_name.toLowerCase().includes(searchQuery.toLowerCase()))
    : manualSongs

  // Get total track count
  const totalTracks = albums.reduce((sum, album) => sum + (album.tracks?.length || 0), 0) + manualSongs.length

  if (authenticated === null) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">Jon Spirit Admin</h1>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              View Site
            </Link>
            <Button onClick={handleLogout} variant="outline" size="sm">
              Logout
            </Button>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-1 border-t border-border pt-2 -mb-[1px]">
            <button
              onClick={() => setActiveTab("music")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "music"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Music size={18} />
              Music Library
              <span className="bg-muted px-2 py-0.5 rounded text-xs">{totalTracks}</span>
            </button>
            <button
              onClick={() => setActiveTab("newsletter")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "newsletter"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Mail size={18} />
              Newsletter
            </button>
            <button
              onClick={() => setActiveTab("subscribers")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "subscribers"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users size={18} />
              Subscribers
              <span className="bg-muted px-2 py-0.5 rounded text-xs">{subscriberCount ?? "—"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* MUSIC TAB */}
        {activeTab === "music" && (
          <div className="space-y-6">
            {/* Music Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold">Music Library</h2>
                <p className="text-muted-foreground mt-1">
                  {totalTracks} songs across {albums.length + (manualSongs.length > 0 ? 1 : 0)} releases
                  {lastMusicUpdate && (
                    <span className="text-xs ml-2">
                      • Updated {lastMusicUpdate.toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setShowUploadModal(true)} 
                  className="gap-2 bg-primary"
                >
                  <Plus size={16} />
                  Upload New Song
                </Button>
                <Button 
                  onClick={() => fetchMusic(true)} 
                  variant="outline" 
                  disabled={loadingTracks}
                  className="gap-2"
                >
                  <RefreshCw size={16} className={loadingTracks ? "animate-spin" : ""} />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search songs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-card border-border"
              />
            </div>

            {/* Album Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedFilter("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === "all" 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card border border-border hover:bg-muted"
                }`}
              >
                All Songs
              </button>
              
              {singles.length > 0 && (
                <button
                  onClick={() => setSelectedFilter("singles")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedFilter === "singles" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-card border border-border hover:bg-muted"
                  }`}
                >
                  <Disc size={14} />
                  Singles ({singles.length})
                </button>
              )}

              {manualSongs.length > 0 && (
                <button
                  onClick={() => setSelectedFilter("manual")}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedFilter === "manual" 
                      ? "bg-purple-500 text-white" 
                      : "bg-card border border-border hover:bg-muted"
                  }`}
                >
                  <Upload size={14} />
                  Manual Uploads ({manualSongs.length})
                </button>
              )}

              {multiTrackAlbums.map(album => (
                <button
                  key={album.id}
                  onClick={() => setSelectedFilter(album.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                    selectedFilter === album.id 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-card border border-border hover:bg-muted"
                  }`}
                >
                  <img 
                    src={album.images[0]?.url || "/placeholder.svg"} 
                    alt={album.name}
                    className="w-5 h-5 rounded object-cover"
                  />
                  {album.name}
                </button>
              ))}
            </div>

            {musicStatus && (
              <div className={`p-4 rounded-lg ${musicStatus.type === "error" ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                {musicStatus.message}
              </div>
            )}

            {loadingTracks && albums.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Loader2 size={32} className="animate-spin mx-auto mb-4" />
                Loading music from Spotify...
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                {/* Songs List */}
                <div className="divide-y divide-border">
                  {/* Show manual songs if filter is "manual" or "all" */}
                  {(selectedFilter === "manual" || selectedFilter === "all") && filteredManualSongs.map((song) => (
                    <div
                      key={song.id}
                      className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="relative">
                        <img
                          src={song.cover_url || "/placeholder.svg"}
                          alt={song.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                          <Upload size={8} className="text-white" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{song.title}</p>
                        <p className="text-sm text-muted-foreground truncate">{song.album_name}</p>
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded mt-1 inline-block">
                          Manual Upload
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* Show Spotify tracks */}
                  {selectedFilter !== "manual" && filteredTracks.map((track) => {
                    const override = overrides[track.id] || { audio_url: null, cover_url: null, hidden: false }
                    const hasAudio = !!override.audio_url
                    const hasCover = !!override.cover_url
                    const isHidden = override.hidden || false

                    return (
                      <div
                        key={track.id}
                        className={`flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors ${isHidden ? "opacity-50" : ""}`}
                      >
                        <div className="relative">
                          <img
                            src={override.cover_url || track.album.images[0]?.url || "/placeholder.svg"}
                            alt={track.name}
                            className="w-12 h-12 rounded object-cover"
                          />
                          {hasCover && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                              <Check size={10} className="text-white" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{track.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{track.album.name}</p>
                          <div className="flex gap-2 mt-1 flex-wrap">
                            {isHidden && (
                              <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded">
                                Hidden
                              </span>
                            )}
                            {hasAudio && (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                                ✓ Custom Audio
                              </span>
                            )}
                            {hasCover && (
                              <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                                ✓ Custom Cover
                              </span>
                            )}
                            {!hasAudio && track.preview_url && (
                              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded">
                                Spotify Preview
                              </span>
                            )}
                            {!hasAudio && !track.preview_url && (
                              <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                                No Audio
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-2 flex-shrink-0">
                          {/* Visibility Toggle */}
                          <button
                            onClick={() => toggleVisibility(track.id, isHidden)}
                            className={`flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                              isHidden
                                ? "bg-gray-500/20 text-gray-400 hover:bg-gray-500/30"
                                : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                            }`}
                            title={isHidden ? "Show on site" : "Hide from site"}
                          >
                            {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
                            {isHidden ? "Hidden" : "Visible"}
                          </button>

                          <div className="relative">
                            <input
                              type="file"
                              accept="audio/*"
                              className="hidden"
                              id={`audio-${track.id}`}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleMusicFileUpload(track.id, file, "audio")
                                e.target.value = ""
                              }}
                              disabled={uploadingFor?.id === track.id}
                            />
                            <label
                              htmlFor={`audio-${track.id}`}
                              className={`flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                                hasAudio
                                  ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                  : "bg-primary/20 text-primary hover:bg-primary/30"
                              } ${uploadingFor?.id === track.id && uploadingFor.type === "audio" ? "opacity-50" : ""}`}
                            >
                              {uploadingFor?.id === track.id && uploadingFor.type === "audio" ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Upload size={14} />
                              )}
                              {hasAudio ? "Replace" : "Audio"}
                            </label>
                          </div>

                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              id={`cover-${track.id}`}
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleMusicFileUpload(track.id, file, "cover")
                                e.target.value = ""
                              }}
                              disabled={uploadingFor?.id === track.id}
                            />
                            <label
                              htmlFor={`cover-${track.id}`}
                              className={`flex items-center gap-1 px-3 py-2 rounded-md text-xs font-medium cursor-pointer transition-colors ${
                                hasCover
                                  ? "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"
                                  : "bg-muted text-muted-foreground hover:bg-muted/80"
                              } ${uploadingFor?.id === track.id && uploadingFor.type === "cover" ? "opacity-50" : ""}`}
                            >
                              {uploadingFor?.id === track.id && uploadingFor.type === "cover" ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Image size={14} />
                              )}
                              {hasCover ? "Replace" : "Cover"}
                            </label>
                          </div>

                          {hasAudio && (
                            <button
                              onClick={() => removeOverride(track.id, "audio")}
                              className="p-2 text-red-400 hover:bg-red-400/10 rounded"
                              title="Remove audio"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}

                  {filteredTracks.length === 0 && (selectedFilter === "manual" ? filteredManualSongs.length === 0 : true) && selectedFilter !== "manual" && (
                    <div className="text-center py-16 text-muted-foreground">
                      {searchQuery ? "No songs match your search" : "No songs found"}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Upload New Song Modal */}
            {showUploadModal && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-card border border-border rounded-lg w-full max-w-md">
                  <div className="p-6 border-b border-border flex items-center justify-between">
                    <h3 className="text-lg font-bold">Upload New Song</h3>
                    <button onClick={() => setShowUploadModal(false)} className="text-muted-foreground hover:text-foreground">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Song Title *</label>
                      <Input
                        type="text"
                        placeholder="Enter song title"
                        value={newSong.title}
                        onChange={(e) => setNewSong(prev => ({ ...prev, title: e.target.value }))}
                        className="bg-input border-border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Album Name <span className="text-muted-foreground font-normal">(optional, defaults to "Singles")</span></label>
                      <Input
                        type="text"
                        placeholder="Singles"
                        value={newSong.albumName}
                        onChange={(e) => setNewSong(prev => ({ ...prev, albumName: e.target.value }))}
                        className="bg-input border-border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Audio File *</label>
                      <input
                        ref={newSongAudioRef}
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setNewSong(prev => ({ ...prev, audioFile: e.target.files?.[0] || null }))}
                        className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer"
                      />
                      {newSong.audioFile && (
                        <p className="text-xs text-green-400 mt-1">✓ {newSong.audioFile.name}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Cover Image <span className="text-muted-foreground font-normal">(optional)</span></label>
                      <input
                        ref={newSongCoverRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => setNewSong(prev => ({ ...prev, coverFile: e.target.files?.[0] || null }))}
                        className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-muted file:text-muted-foreground hover:file:bg-muted/80 file:cursor-pointer cursor-pointer"
                      />
                      {newSong.coverFile && (
                        <p className="text-xs text-green-400 mt-1">✓ {newSong.coverFile.name}</p>
                      )}
                    </div>
                  </div>
                  <div className="p-6 border-t border-border flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => setShowUploadModal(false)}>Cancel</Button>
                    <Button 
                      onClick={handleNewSongUpload} 
                      disabled={uploadingNewSong || !newSong.title || !newSong.audioFile}
                      className="gap-2"
                    >
                      {uploadingNewSong ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                      {uploadingNewSong ? "Uploading..." : "Upload Song"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* NEWSLETTER TAB */}
        {activeTab === "newsletter" && (
          <div className="max-w-2xl">
            <div className="mb-6">
              <h2 className="text-2xl font-bold">Send Newsletter</h2>
              <p className="text-muted-foreground mt-1">
                Send to all {subscriberCount || 0} subscribers
              </p>
            </div>

            <form onSubmit={sendNewsletter} className="bg-card border border-border rounded-lg p-6 space-y-6">
              {/* Newsletter Type Toggle */}
              <div>
                <label className="block text-sm font-medium mb-2">Newsletter Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewsletterType("poster")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      newsletterType === "poster"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    🖼️ Poster Image
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewsletterType("text")}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      newsletterType === "text"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    ✍️ Text Content
                  </button>
                </div>
              </div>

              {/* Subject with Emoji Picker */}
              <div>
                <label className="block text-sm font-medium mb-2">Email Subject</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="e.g., New Track Out Now!"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    disabled={sending || uploading}
                    className="bg-input border-border flex-1"
                  />
                  <div className="relative">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                      className="px-3"
                    >
                      😀
                    </Button>
                    {showEmojiPicker && (
                      <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg p-4 z-50 shadow-2xl min-w-[280px]">
                        <div className="grid grid-cols-8 gap-1">
                          {EMOJI_LIST.map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => addEmoji(emoji)}
                              className="text-2xl hover:bg-muted p-2 rounded transition-colors"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Poster Upload - Only show for poster type */}
              {newsletterType === "poster" && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Text Above Poster <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-1 flex-wrap pb-2">
                        {EMOJI_LIST.slice(0, 8).map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setPosterText(prev => prev + emoji)}
                            className="text-lg hover:bg-muted p-1 rounded"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                      <textarea
                        placeholder="Optional intro text before the poster..."
                        value={posterText}
                        onChange={(e) => setPosterText(e.target.value)}
                        disabled={sending}
                        rows={3}
                        className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Poster Image</label>
                    <div className="space-y-3">
                      <div className="flex gap-2 items-center">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          disabled={sending || uploading}
                          className="block flex-1 text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer cursor-pointer"
                        />
                        {posterUrl && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={clearImage}
                            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                          >
                            ✕ Remove
                          </Button>
                        )}
                      </div>
                      {uploading && (
                        <p className="text-sm text-muted-foreground">Uploading...</p>
                      )}
                      {posterUrl && (
                        <div className="mt-3">
                          <p className="text-sm text-green-400 mb-2">✓ Image uploaded</p>
                          <img 
                            src={posterUrl} 
                            alt="Preview" 
                            className="max-w-sm rounded-lg border border-border"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Text Content - Only show for text type */}
              {newsletterType === "text" && (
                <div>
                  <label className="block text-sm font-medium mb-2">Content</label>
                  <div className="space-y-2">
                    <div className="flex gap-1 flex-wrap pb-2">
                      {EMOJI_LIST.slice(0, 8).map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => addEmojiToContent(emoji)}
                          className="text-lg hover:bg-muted p-1 rounded"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <textarea
                      placeholder="Write your newsletter content here..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required={newsletterType === "text"}
                      disabled={sending}
                      rows={8}
                      className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                    />
                  </div>
                </div>
              )}

              {/* CTA Button Options */}
              <div className="border border-border rounded-lg p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="showButton"
                    checked={showButton}
                    onChange={(e) => setShowButton(e.target.checked)}
                    className="w-4 h-4 accent-primary"
                  />
                  <label htmlFor="showButton" className="text-sm font-medium">
                    Include CTA Button
                  </label>
                </div>
                
                {showButton && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Button Text</label>
                      <Input
                        type="text"
                        value={buttonText}
                        onChange={(e) => setButtonText(e.target.value)}
                        placeholder="LISTEN NOW"
                        disabled={sending}
                        className="bg-input border-border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">Button Link</label>
                      <Input
                        type="url"
                        value={buttonLink}
                        onChange={(e) => setButtonLink(e.target.value)}
                        placeholder="https://jonspirit.com/music"
                        disabled={sending}
                        className="bg-input border-border"
                      />
                    </div>
                  </div>
                )}
              </div>

              {sendStatus && (
                <div className={`p-4 rounded-lg ${sendStatus.type === "error" ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                  {sendStatus.message}
                </div>
              )}

              <div className="flex items-center gap-4 pt-2">
                <Button
                  type="submit"
                  disabled={sending || uploading || !subject.trim() || (newsletterType === "poster" ? !posterUrl : !content.trim())}
                  className="bg-primary hover:bg-primary/90"
                >
                  {sending ? "Sending..." : "Send Newsletter"}
                </Button>
                <span className="text-sm text-muted-foreground">
                  Sends immediately to all active subscribers
                </span>
              </div>
            </form>
          </div>
        )}

        {/* SUBSCRIBERS TAB */}
        {activeTab === "subscribers" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Subscribers</h2>
                <p className="text-muted-foreground mt-1">
                  {subscriberCount || 0} total subscribers
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={fetchSubscribers} variant="outline" disabled={loadingSubscribers} className="gap-2">
                  <RefreshCw size={16} className={loadingSubscribers ? "animate-spin" : ""} />
                  Refresh
                </Button>
                <a
                  href="https://dashboard.mailerlite.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline">Open MailerLite →</Button>
                </a>
              </div>
            </div>

            <div className="bg-card border border-border rounded-lg">
              {loadingSubscribers ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Loader2 size={32} className="animate-spin mx-auto mb-4" />
                  Loading subscribers...
                </div>
              ) : subscribers.length === 0 ? (
                <p className="text-muted-foreground text-center py-16">No subscribers yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm text-muted-foreground border-b border-border">
                        <th className="p-4 font-medium">Email</th>
                        <th className="p-4 font-medium">Status</th>
                        <th className="p-4 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {subscribers.map((sub) => (
                        <tr key={sub.id} className="border-b border-border/50 hover:bg-muted/20">
                          <td className="p-4">{sub.email}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              sub.status === "active" 
                                ? "bg-green-500/20 text-green-400" 
                                : "bg-yellow-500/20 text-yellow-400"
                            }`}>
                              {sub.status}
                            </span>
                          </td>
                          <td className="p-4 text-muted-foreground">
                            {new Date(sub.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
