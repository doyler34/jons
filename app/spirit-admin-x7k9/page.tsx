"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Upload, Music, Image, Check, X, Loader2 } from "lucide-react"

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
    name: string
    images: { url: string }[]
  }
}

interface SongOverride {
  audio_url: string | null
  cover_url: string | null
}

const EMOJI_LIST = ["🔥", "🎵", "🎤", "💿", "🎧", "⚡", "💀", "👻", "🖤", "❤️", "🚨", "📢", "🆕", "✨", "💯", "🙏"]

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Music management state
  const [tracks, setTracks] = useState<SpotifyTrack[]>([])
  const [overrides, setOverrides] = useState<Record<string, SongOverride>>({})
  const [loadingTracks, setLoadingTracks] = useState(false)
  const [uploadingFor, setUploadingFor] = useState<{ id: string; type: "audio" | "cover" } | null>(null)
  const [musicStatus, setMusicStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  // Newsletter state
  const [newsletterType, setNewsletterType] = useState<"poster" | "text">("poster")
  const [subject, setSubject] = useState("")
  const [content, setContent] = useState("")
  const [posterText, setPosterText] = useState("") // Optional text above poster
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
        fetchSubscribers()
        fetchTracks()
      } else {
        router.push("/spirit-admin-x7k9/login")
      }
    } catch {
      router.push("/spirit-admin-x7k9/login")
    }
  }

  const fetchTracks = async () => {
    setLoadingTracks(true)
    try {
      // Fetch Spotify tracks
      const spotifyRes = await fetch("/api/spotify")
      const spotifyData = await spotifyRes.json()
      if (spotifyData.topTracks) {
        setTracks(spotifyData.topTracks)
      }

      // Fetch overrides from database
      const overridesRes = await fetch("/api/songs/overrides")
      const overridesData = await overridesRes.json()
      setOverrides(overridesData.overrides || {})
    } catch (error) {
      console.error("Failed to fetch tracks:", error)
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
      // Upload file to Vercel Blob
      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadRes.ok) {
        throw new Error("Upload failed")
      }

      const { url } = await uploadRes.json()

      // Save override to database
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

      // Update local state
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
      setMusicStatus({ type: "error", message: "Upload failed" })
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
    setLoading(true)
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
      setLoading(false)
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

    console.log("Sending newsletter with payload:", payload)

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
    
    // Always reset sending state
    setSending(false)
  }

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
      <header className="border-b border-border bg-card">
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
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-sm text-muted-foreground mb-2">Newsletter Subscribers</h3>
            <p className="text-3xl font-bold text-primary">
              {subscriberCount !== null ? subscriberCount : "—"}
            </p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-sm text-muted-foreground mb-2">Quick Links</h3>
            <div className="flex flex-wrap gap-2 mt-2">
              <a
                href="https://dashboard.mailerlite.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                MailerLite →
              </a>
              <a
                href="https://open.spotify.com/artist"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Spotify →
              </a>
            </div>
          </div>
          <div className="bg-card border border-border rounded-lg p-6">
            <h3 className="text-sm text-muted-foreground mb-2">Site Status</h3>
            <p className="text-green-500 font-medium flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </p>
          </div>
        </div>

        {/* Music Management */}
        <div className="bg-card border border-border rounded-lg mb-8">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Music size={20} /> Music Library
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Upload audio files and custom covers for your tracks
              </p>
            </div>
            <Button onClick={fetchTracks} variant="outline" size="sm" disabled={loadingTracks}>
              {loadingTracks ? <Loader2 size={16} className="animate-spin" /> : "Refresh"}
            </Button>
          </div>

          <div className="p-6">
            {musicStatus && (
              <p className={`text-sm mb-4 ${musicStatus.type === "error" ? "text-red-400" : "text-green-400"}`}>
                {musicStatus.message}
              </p>
            )}

            {loadingTracks ? (
              <div className="text-center py-8 text-muted-foreground">
                <Loader2 size={24} className="animate-spin mx-auto mb-2" />
                Loading tracks...
              </div>
            ) : tracks.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No tracks found from Spotify</p>
            ) : (
              <div className="space-y-4">
                {tracks.map((track) => {
                  const override = overrides[track.id] || { audio_url: null, cover_url: null }
                  const hasAudio = !!override.audio_url
                  const hasCover = !!override.cover_url

                  return (
                    <div
                      key={track.id}
                      className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg border border-border"
                    >
                      {/* Cover Image */}
                      <div className="relative group">
                        <img
                          src={override.cover_url || track.album.images[0]?.url || "/placeholder.svg"}
                          alt={track.name}
                          className="w-16 h-16 rounded object-cover"
                        />
                        {hasCover && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <Check size={10} className="text-white" />
                          </div>
                        )}
                      </div>

                      {/* Track Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{track.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{track.album.name}</p>
                        <div className="flex gap-2 mt-1">
                          {hasAudio && (
                            <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                              ✓ Audio
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
                        </div>
                      </div>

                      {/* Upload Buttons */}
                      <div className="flex gap-2">
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
                            {hasAudio ? "Replace Audio" : "Upload Audio"}
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
                            {hasCover ? "Replace Cover" : "Custom Cover"}
                          </label>
                        </div>

                        {/* Remove buttons */}
                        {(hasAudio || hasCover) && (
                          <div className="flex gap-1">
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
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Send Newsletter */}
        <div className="bg-card border border-border rounded-lg mb-8 overflow-visible">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold">Send Newsletter</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Create and send to all {subscriberCount || 0} subscribers
            </p>
          </div>
          
          <form onSubmit={sendNewsletter} className="p-6 space-y-6 overflow-visible">
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
                {/* Optional text above poster */}
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
                          title={`Add ${emoji}`}
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
                        title={`Add ${emoji}`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder="Write your newsletter content here...

Use double line breaks to separate paragraphs."
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
              <p className={`text-sm ${sendStatus.type === "error" ? "text-red-400" : "text-green-400"}`}>
                {sendStatus.message}
              </p>
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

        {/* Recent Subscribers */}
        <div className="bg-card border border-border rounded-lg">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Subscribers</h2>
            <Button onClick={fetchSubscribers} variant="outline" size="sm" disabled={loading}>
              {loading ? "..." : "Refresh"}
            </Button>
          </div>
          
          <div className="p-6">
            {loading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : subscribers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No subscribers yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-muted-foreground border-b border-border">
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {subscribers.map((sub) => (
                      <tr key={sub.id} className="border-b border-border/50">
                        <td className="py-3">{sub.email}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            sub.status === "active" 
                              ? "bg-green-500/20 text-green-400" 
                              : "bg-yellow-500/20 text-yellow-400"
                          }`}>
                            {sub.status}
                          </span>
                        </td>
                        <td className="py-3 text-muted-foreground">
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
      </main>
    </div>
  )
}
