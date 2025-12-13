"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Upload, Music, Image, Check, X, Loader2, Mail, Users, RefreshCw } from "lucide-react"

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

  // Get total track count
  const totalTracks = albums.reduce((sum, album) => sum + (album.tracks?.length || 0), 0)

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
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Music Library</h2>
                <p className="text-muted-foreground mt-1">
                  {totalTracks} songs across {albums.length} releases
                  {lastMusicUpdate && (
                    <span className="text-xs ml-2">
                      • Updated {lastMusicUpdate.toLocaleTimeString()}
                    </span>
                  )}
                </p>
              </div>
              <Button 
                onClick={() => fetchMusic(true)} 
                variant="outline" 
                disabled={loadingTracks}
                className="gap-2"
              >
                <RefreshCw size={16} className={loadingTracks ? "animate-spin" : ""} />
                {loadingTracks ? "Refreshing..." : "Refresh from Spotify"}
              </Button>
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
            ) : albums.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                No music found from Spotify
              </div>
            ) : (
              <div className="space-y-8">
                {albums.map((album) => (
                  <div key={album.id} className="bg-card border border-border rounded-lg overflow-hidden">
                    {/* Album Header */}
                    <div className="flex items-center gap-4 p-4 bg-muted/30 border-b border-border">
                      <img
                        src={album.images[0]?.url || "/placeholder.svg"}
                        alt={album.name}
                        className="w-16 h-16 rounded object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-lg">{album.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {album.tracks?.length || 0} tracks • {album.release_date}
                        </p>
                      </div>
                    </div>

                    {/* Tracks */}
                    <div className="divide-y divide-border">
                      {album.tracks?.map((track) => {
                        const override = overrides[track.id] || { audio_url: null, cover_url: null }
                        const hasAudio = !!override.audio_url
                        const hasCover = !!override.cover_url

                        return (
                          <div
                            key={track.id}
                            className="flex items-center gap-4 p-4 hover:bg-muted/20 transition-colors"
                          >
                            {/* Cover Image */}
                            <div className="relative">
                              <img
                                src={override.cover_url || track.album.images[0]?.url || album.images[0]?.url || "/placeholder.svg"}
                                alt={track.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                              {hasCover && (
                                <div className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                                  <Check size={10} className="text-white" />
                                </div>
                              )}
                            </div>

                            {/* Track Info */}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground truncate">{track.name}</p>
                              <div className="flex gap-2 mt-1 flex-wrap">
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

                            {/* Upload Buttons */}
                            <div className="flex gap-2 flex-shrink-0">
                              {/* Audio Upload */}
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

                              {/* Cover Upload */}
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

                              {/* Remove buttons */}
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
                    </div>
                  </div>
                ))}
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
