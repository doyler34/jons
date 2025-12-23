"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Upload, Music, Image, Check, X, Loader2, Mail, Users, RefreshCw, Search, Plus, Disc, Eye, EyeOff, Calendar, MapPin, Ticket, Edit, Trash2, Settings, Globe, Link2, Save, Download, BarChart3, TrendingUp, ExternalLink } from "lucide-react"

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

interface Event {
  id: number
  title: string
  venue: string
  city: string
  date: string
  time: string | null
  ticket_url: string | null
  description: string | null
  image_url: string | null
  is_past: boolean
  created_at: string
  updated_at: string
}

interface NewsletterTemplate {
  name: string
  subject: string
  contentHtml: string
  type: "text" | "poster"
  posterHtml?: string
  buttonText?: string
  buttonLink?: string
  showButton?: boolean
}

interface NewsletterStat {
  id: number
  subject: string
  status: string
  sent_at: string | null
  scheduled_at: string | null
  open_count: number
  click_count: number
  created_at: string | null
}

const EMOJI_LIST = ["🔥", "🎵", "🎤", "💿", "🎧", "⚡", "💀", "👻", "🖤", "❤️", "🚨", "📢", "🆕", "✨", "💯", "🙏"]

type TabType = "music" | "newsletter" | "subscribers" | "events" | "settings" | "analytics"

export default function AdminDashboard() {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>("music")
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const contentEditorRef = useRef<HTMLDivElement>(null)
  const posterEditorRef = useRef<HTMLDivElement>(null)

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
  const [content, setContentHtml] = useState("")
  const [posterHtml, setPosterHtml] = useState("")
  const [posterUrl, setPosterUrl] = useState("")
  const [buttonText, setButtonText] = useState("LISTEN NOW")
  const [buttonLink, setButtonLink] = useState("https://jonspirit.com/music")
  const [showButton, setShowButton] = useState(true)
  const [sendMode, setSendMode] = useState<"now" | "schedule">("now")
  const [scheduledAt, setScheduledAt] = useState("")
  const [previewHtml, setPreviewHtml] = useState("")
  const [showPreview, setShowPreview] = useState(true)
  const [templates, setTemplates] = useState<NewsletterTemplate[]>([])
  const [templateName, setTemplateName] = useState("")
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Newsletter analytics
  const [newsletterStats, setNewsletterStats] = useState<NewsletterStat[]>([])
  const [loadingNewsletterStats, setLoadingNewsletterStats] = useState(false)

  // Events state
  const [events, setEvents] = useState<Event[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  const [eventForm, setEventForm] = useState({
    title: "",
    venue: "",
    city: "",
    date: "",
    time: "",
    ticket_url: "",
    description: "",
    is_past: false,
  })
  const [eventStatus, setEventStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [savingEvent, setSavingEvent] = useState(false)

  // Settings state
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({})
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsStatus, setSettingsStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)

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
        fetchNewsletterStats()
        fetchManualSongs()
        fetchEvents()
        fetchSettings()
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

  const fetchNewsletterStats = async () => {
    setLoadingNewsletterStats(true)
    try {
      const response = await fetch("/api/admin/newsletter/stats")
      if (response.ok) {
        const data = await response.json()
        setNewsletterStats(data.stats || [])
      }
    } catch (error) {
      console.error("Failed to fetch newsletter stats:", error)
    } finally {
      setLoadingNewsletterStats(false)
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

  const sanitizeClientHtml = (html: string) => {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html || "", "text/html")
      const allowedTags = new Set(["b", "strong", "i", "em", "u", "p", "br", "ul", "ol", "li", "a", "h1", "h2", "h3", "h4", "h5", "h6", "span", "blockquote"])
      const allowedAttrs = new Set(["href", "target", "rel"])

      doc.querySelectorAll("*").forEach((el) => {
        if (!allowedTags.has(el.tagName.toLowerCase())) {
          el.replaceWith(...Array.from(el.childNodes))
          return
        }

        Array.from(el.attributes).forEach((attr) => {
          const name = attr.name.toLowerCase()
          if (name.startsWith("on") || !allowedAttrs.has(name)) {
            el.removeAttribute(attr.name)
          }
        })

        if (el.tagName.toLowerCase() === "a" && !el.getAttribute("rel")) {
          el.setAttribute("rel", "noopener noreferrer")
        }
      })

      return doc.body.innerHTML
    } catch {
      return html || ""
    }
  }

  const stripHtml = (html: string) => sanitizeClientHtml(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()

  const handlePosterInput = () => {
    if (!posterEditorRef.current) return
    const html = sanitizeClientHtml(posterEditorRef.current.innerHTML)
    setPosterHtml(html)
  }

  const buildPreviewHtml = () => {
    const header = `
      <tr>
        <td align="center" style="padding-bottom:24px;">
          <h1 style="margin:0;font-size:28px;font-weight:bold;color:#d8d0bf;font-family:'Brush Script MT','Lucida Handwriting',Georgia,cursive;">
            JON SPIRIT
          </h1>
        </td>
      </tr>`

    if (newsletterType === "text") {
      const safeContent = sanitizeClientHtml(content || "")
      const button = showButton && buttonText && buttonLink
        ? `<div style="padding-top:24px;">
            <a href="${buttonLink}" style="display:inline-block;background-color:#dc2626;color:#ffffff;font-weight:bold;font-size:14px;padding:14px 32px;border-radius:6px;text-decoration:none;letter-spacing:1px;">
              ${buttonText}
            </a>
          </div>`
        : ""

      return `
      <div style="background:#0a0a0a;padding:24px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a;">
          <tr>
            <td align="center" style="padding:0 12px;">
              <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
                ${header}
                <tr>
                  <td style="background-color:#141414;border-radius:12px;padding:32px;border:1px solid #262626;">
                    <h2 style="margin:0 0 16px 0;font-size:22px;font-weight:bold;color:#f5f5f5;">${subject || "Subject"}</h2>
                    <div style="color:#d4d4d4;font-size:15px;line-height:1.6;">${safeContent || "<p style='color:#666;'>Start writing your email content...</p>"}</div>
                    ${button}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>`
    }

    // Poster preview
    const posterTextHtml = sanitizeClientHtml(posterHtml || "")

    const button = showButton && buttonText && buttonLink
      ? `<div style="padding-top:24px;text-align:center;">
            <a href="${buttonLink}" style="display:inline-block;background-color:#dc2626;color:#ffffff;font-weight:bold;font-size:14px;padding:14px 32px;border-radius:6px;text-decoration:none;letter-spacing:1px;">
              ${buttonText}
            </a>
          </div>`
      : ""

    const safePosterBody = posterTextHtml || "<p style='color:#666;'>Add body text for this poster email...</p>"

    return `
    <div style="background:#0a0a0a;padding:24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#0a0a0a;">
        <tr>
          <td align="center" style="padding:0 12px;">
            <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
              ${header}
              <tr>
                <td style="background-color:#141414;border-radius:12px;padding:24px;border:1px solid #262626;">
                  ${posterUrl
                    ? `<div style="margin:0 auto 16px auto;max-width:100%;border-radius:8px;overflow:hidden;border:1px solid #262626;">
                        <img src="${posterUrl}" alt="${subject || "Poster"}" style="display:block;width:100%;height:auto;" />
                      </div>`
                    : `<div style="width:100%;height:240px;border:1px dashed #333;border-radius:8px;color:#666;display:flex;align-items:center;justify-content:center;margin-bottom:16px;">Upload a poster to preview</div>`}
                  <div style="color:#d4d4d4;font-size:15px;line-height:1.6;">${safePosterBody}</div>
                  ${button}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </div>`
  }

  useEffect(() => {
    // Load saved templates (local only, no backend dependency)
    try {
      const saved = localStorage.getItem("newsletterTemplates")
      if (saved) {
        setTemplates(JSON.parse(saved))
      }
    } catch (error) {
      console.error("Failed to load templates", error)
    }
  }, [])

  useEffect(() => {
    setPreviewHtml(buildPreviewHtml())
  }, [content, newsletterType, subject, posterUrl, posterHtml, buttonText, buttonLink, showButton])

  const addEmoji = (emoji: string) => {
    setSubject(prev => prev + emoji)
    setShowEmojiPicker(false)
  }

  const addEmojiToContent = (emoji: string) => {
    if (newsletterType !== "text") return
    if (contentEditorRef.current) {
      contentEditorRef.current.focus()
      document.execCommand("insertText", false, emoji)
      const html = sanitizeClientHtml(contentEditorRef.current.innerHTML)
      setContentHtml(html)
    } else {
      setContentHtml(prev => prev + emoji)
    }
  }

  const addEmojiToPoster = (emoji: string) => {
    if (newsletterType !== "poster") return
    if (posterEditorRef.current) {
      posterEditorRef.current.focus()
      document.execCommand("insertText", false, emoji)
      const html = sanitizeClientHtml(posterEditorRef.current.innerHTML)
      setPosterHtml(html)
    } else {
      setPosterHtml((prev) => prev + emoji)
    }
  }

  const insertTokenIntoContent = (token: string) => {
    if (newsletterType !== "text") {
      setSubject((prev) => prev + token)
      return
    }
    if (contentEditorRef.current) {
      contentEditorRef.current.focus()
      document.execCommand("insertText", false, token)
      const html = sanitizeClientHtml(contentEditorRef.current.innerHTML)
      setContentHtml(html)
    } else {
      setContentHtml((prev) => prev + token)
    }
  }

  const handleContentInput = () => {
    if (!contentEditorRef.current) return
    const html = sanitizeClientHtml(contentEditorRef.current.innerHTML)
    setContentHtml(html)
  }

  const runCommand = (command: string, value?: string) => {
    if (!contentEditorRef.current) return
    contentEditorRef.current.focus()
    document.execCommand(command, false, value)
    handleContentInput()
  }

  const runPosterCommand = (command: string, value?: string) => {
    if (!posterEditorRef.current) return
    posterEditorRef.current.focus()
    document.execCommand(command, false, value)
    handlePosterInput()
  }

  const addLinkToContent = () => {
    const url = prompt("Add link URL")
    if (url) {
      runCommand("createLink", url)
    }
  }

  const addLinkToPoster = () => {
    const url = prompt("Add link URL")
    if (url) {
      runPosterCommand("createLink", url)
    }
  }

  const saveTemplateToLocal = () => {
    if (!templateName.trim()) {
      setSendStatus({ type: "error", message: "Template name is required" })
      return
    }
    if (newsletterType === "text" && !stripHtml(content)) {
      setSendStatus({ type: "error", message: "Add content before saving template" })
      return
    }
    const newTemplate: NewsletterTemplate = {
      name: templateName.trim(),
      subject,
      contentHtml: sanitizeClientHtml(content),
      posterHtml: sanitizeClientHtml(posterHtml),
      type: newsletterType,
      buttonText,
      buttonLink,
      showButton,
    }
    const updated = [
      ...templates.filter(t => t.name !== newTemplate.name),
      newTemplate,
    ]
    setTemplates(updated)
    localStorage.setItem("newsletterTemplates", JSON.stringify(updated))
    setSendStatus({ type: "success", message: "Template saved locally" })
  }

  const applyTemplate = (name: string) => {
    const tpl = templates.find((t) => t.name === name)
    if (!tpl) return
    setSubject(tpl.subject)
    setPosterHtml(tpl.posterHtml || "")
    setButtonText(tpl.buttonText || "LISTEN NOW")
    setButtonLink(tpl.buttonLink || "https://jonspirit.com/music")
    setShowButton(tpl.showButton ?? true)
    setContentHtml(tpl.contentHtml || "")
    setNewsletterType(tpl.type)
    if (contentEditorRef.current) {
      contentEditorRef.current.innerHTML = tpl.contentHtml || ""
    }
    if (posterEditorRef.current) {
      posterEditorRef.current.innerHTML = tpl.posterHtml || ""
    }
    setSendStatus({ type: "success", message: `Applied template "${tpl.name}"` })
  }

  const sendNewsletter = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newsletterType === "poster" && (!subject.trim() || !posterUrl)) {
      setSendStatus({ type: "error", message: "Subject and poster image are required" })
      return
    }
    if (newsletterType === "text" && (!subject.trim() || !stripHtml(content))) {
      setSendStatus({ type: "error", message: "Subject and content are required" })
      return
    }

    if (sendMode === "schedule") {
      const scheduleDate = scheduledAt ? new Date(scheduledAt) : null
      if (!scheduleDate || isNaN(scheduleDate.getTime()) || scheduleDate.getTime() <= Date.now()) {
        setSendStatus({ type: "error", message: "Choose a future date/time to schedule in MailerLite" })
        return
      }
    }

    if (!confirm(`Send newsletter "${subject}" ${sendMode === "schedule" ? "scheduled via MailerLite" : "now"} to all ${subscriberCount || 0} subscribers?`)) {
      return
    }

    setSending(true)
    setSendStatus(null)

    const payload = {
      subject,
      type: newsletterType,
      posterUrl: newsletterType === "poster" ? posterUrl : undefined,
      posterText: newsletterType === "poster" && stripHtml(posterHtml) ? posterHtml : undefined,
      htmlContent: newsletterType === "text" ? sanitizeClientHtml(content) : undefined,
      buttonText: showButton ? buttonText : undefined,
      buttonLink: showButton ? buttonLink : undefined,
      sendMode,
      scheduledAt: sendMode === "schedule" ? scheduledAt : undefined,
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
        data = { message: "Newsletter queued", error: "Could not parse response" }
      }

      if (response.ok) {
        setSendStatus({ type: "success", message: data.message || (sendMode === "schedule" ? "Newsletter scheduled!" : "Newsletter sent!") })
        setSubject("")
        setContentHtml("")
        setPosterHtml("")
        setPosterUrl("")
        setScheduledAt("")
        setSendMode("now")
        if (fileInputRef.current) fileInputRef.current.value = ""
        if (contentEditorRef.current) contentEditorRef.current.innerHTML = ""
        if (posterEditorRef.current) posterEditorRef.current.innerHTML = ""
        fetchNewsletterStats()
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

  // Fetch events
  const fetchEvents = async () => {
    setLoadingEvents(true)
    try {
      const res = await fetch("/api/events")
      if (res.ok) {
        const data = await res.json()
        setEvents(data.events || [])
      }
    } catch (error) {
      console.error("Failed to fetch events:", error)
    } finally {
      setLoadingEvents(false)
    }
  }

  // Save event (create or update)
  const saveEvent = async () => {
    if (!eventForm.title || !eventForm.venue || !eventForm.city || !eventForm.date) {
      setEventStatus({ type: "error", message: "Title, venue, city, and date are required" })
      return
    }

    setSavingEvent(true)
    setEventStatus(null)

    try {
      const url = editingEvent ? `/api/events/${editingEvent.id}` : "/api/events"
      const method = editingEvent ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(eventForm),
      })

      if (!res.ok) throw new Error("Failed to save event")

      const data = await res.json()
      
      if (editingEvent) {
        setEvents(prev => prev.map(e => e.id === editingEvent.id ? data.event : e))
        setEventStatus({ type: "success", message: "Event updated!" })
      } else {
        setEvents(prev => [data.event, ...prev])
        setEventStatus({ type: "success", message: "Event created!" })
      }

      setShowEventModal(false)
      setEditingEvent(null)
      setEventForm({ title: "", venue: "", city: "", date: "", time: "", ticket_url: "", description: "", is_past: false })
    } catch (error) {
      console.error("Save event error:", error)
      setEventStatus({ type: "error", message: "Failed to save event" })
    } finally {
      setSavingEvent(false)
    }
  }

  // Delete event
  const deleteEvent = async (id: number) => {
    if (!confirm("Are you sure you want to delete this event?")) return

    try {
      const res = await fetch(`/api/events/${id}`, { method: "DELETE" })
      if (res.ok) {
        setEvents(prev => prev.filter(e => e.id !== id))
        setEventStatus({ type: "success", message: "Event deleted" })
      }
    } catch (error) {
      console.error("Delete event error:", error)
      setEventStatus({ type: "error", message: "Failed to delete event" })
    }
  }

  // Open edit modal
  const openEditEvent = (event: Event) => {
    setEditingEvent(event)
    setEventForm({
      title: event.title,
      venue: event.venue,
      city: event.city,
      date: event.date.split("T")[0],
      time: event.time || "",
      ticket_url: event.ticket_url || "",
      description: event.description || "",
      is_past: event.is_past,
    })
    setShowEventModal(true)
  }

  // Open new event modal
  const openNewEvent = () => {
    setEditingEvent(null)
    setEventForm({ title: "", venue: "", city: "", date: "", time: "", ticket_url: "", description: "", is_past: false })
    setShowEventModal(true)
  }

  // Fetch site settings
  const fetchSettings = async () => {
    setLoadingSettings(true)
    try {
      const res = await fetch("/api/settings")
      if (res.ok) {
        const data = await res.json()
        setSiteSettings(data.settings || {})
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error)
    } finally {
      setLoadingSettings(false)
    }
  }

  // Save site settings
  const saveSettings = async () => {
    setSavingSettings(true)
    setSettingsStatus(null)

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings: siteSettings }),
      })

      if (!res.ok) throw new Error("Failed to save settings")
      
      setSettingsStatus({ type: "success", message: "Settings saved successfully!" })
    } catch (error) {
      console.error("Save settings error:", error)
      setSettingsStatus({ type: "error", message: "Failed to save settings" })
    } finally {
      setSavingSettings(false)
    }
  }

  // Update a single setting
  const updateSetting = (key: string, value: string) => {
    setSiteSettings(prev => ({ ...prev, [key]: value }))
  }

  // Delete a subscriber (GDPR)
  const deleteSubscriber = async (id: string, email: string) => {
    if (!confirm(`Delete subscriber "${email}"? This action cannot be undone (GDPR deletion).`)) return

    try {
      const res = await fetch(`/api/admin/subscribers/${id}`, { method: "DELETE" })
      if (res.ok) {
        setSubscribers(prev => prev.filter(s => s.id !== id))
        setSubscriberCount(prev => (prev ?? 1) - 1)
      } else {
        alert("Failed to delete subscriber")
      }
    } catch (error) {
      console.error("Delete subscriber error:", error)
      alert("Failed to delete subscriber")
    }
  }

  // Export subscribers as CSV (GDPR)
  const exportSubscribers = async () => {
    try {
      const res = await fetch("/api/admin/subscribers/export")
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `subscribers_${new Date().toISOString().split("T")[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
      } else {
        alert("Failed to export subscribers")
      }
    } catch (error) {
      console.error("Export subscribers error:", error)
      alert("Failed to export subscribers")
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
            <button
              onClick={() => setActiveTab("events")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "events"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Calendar size={18} />
              Events
              <span className="bg-muted px-2 py-0.5 rounded text-xs">{events.length}</span>
            </button>
            <button
              onClick={() => setActiveTab("settings")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "settings"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Settings size={18} />
              Settings
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "analytics"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <BarChart3 size={18} />
              Analytics
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
                      Poster Body Text (rich)
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-1 flex-wrap pb-1">
                        {EMOJI_LIST.slice(0, 8).map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => addEmojiToPoster(emoji)}
                            className="text-lg hover:bg-muted p-1 rounded"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => runPosterCommand("bold")}>Bold</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => runPosterCommand("italic")}>Italic</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => runPosterCommand("underline")}>Underline</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => runPosterCommand("insertUnorderedList")}>Bullet List</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => runPosterCommand("insertOrderedList")}>Numbered List</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => runPosterCommand("formatBlock", "h3")}>Heading</Button>
                        <Button type="button" variant="outline" size="sm" onClick={addLinkToPoster}>Add Link</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => runPosterCommand("formatBlock", "h2")}>H2</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => runPosterCommand("formatBlock", "h1")}>H1</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => runPosterCommand("formatBlock", "blockquote")}>Quote</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => runPosterCommand("justifyLeft")}>Left</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => runPosterCommand("justifyCenter")}>Center</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => runPosterCommand("justifyRight")}>Right</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => runPosterCommand("removeFormat")}>Clear</Button>
                      </div>

                      <div
                        ref={posterEditorRef}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={handlePosterInput}
                        className="w-full min-h-[160px] bg-input border border-border rounded-md px-3 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 prose prose-invert max-w-none"
                      />
                      <p className="text-xs text-muted-foreground">
                        Same email template styling as text emails; poster image sits above this content.
                      </p>
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
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <label className="block text-sm font-medium">Content</label>
                    <div className="flex gap-2 flex-wrap text-xs text-muted-foreground">
                      <span>Tokens:</span>
                      <button type="button" onClick={() => insertTokenIntoContent("{{name}}")} className="px-2 py-1 rounded bg-muted hover:bg-muted/80">
                        {"{{name}}"}
                      </button>
                      <button type="button" onClick={() => insertTokenIntoContent("{{email}}")} className="px-2 py-1 rounded bg-muted hover:bg-muted/80">
                        {"{{email}}"}
                      </button>
                      <button type="button" onClick={() => insertTokenIntoContent("{{unsubscribe}}")} className="px-2 py-1 rounded bg-muted hover:bg-muted/80">
                        {"{{unsubscribe}}"}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-1 flex-wrap pb-1">
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

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => runCommand("bold")}>
                      Bold
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => runCommand("italic")}>
                      Italic
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => runCommand("underline")}>
                      Underline
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => runCommand("insertUnorderedList")}>
                      Bullet List
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => runCommand("insertOrderedList")}>
                      Numbered List
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => runCommand("formatBlock", "h3")}>
                      Heading
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={addLinkToContent}>
                      Add Link
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => runCommand("formatBlock", "h2")}>
                      H2
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => runCommand("formatBlock", "h1")}>
                      H1
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => runCommand("formatBlock", "blockquote")}>
                      Quote
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => runCommand("justifyLeft")}>
                      Left
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => runCommand("justifyCenter")}>
                      Center
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => runCommand("justifyRight")}>
                      Right
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => runCommand("removeFormat")}>
                      Clear
                    </Button>
                  </div>

                  <div
                    ref={contentEditorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleContentInput}
                    className="w-full min-h-[220px] bg-input border border-border rounded-md px-3 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 prose prose-invert max-w-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    Supports bold, italic, headings, lists, links, and personalization tokens.
                  </p>
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

              {/* Templates + Scheduling */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="border border-border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Templates</h4>
                    <Button variant="ghost" size="sm" onClick={() => setShowPreview((prev) => !prev)}>
                      {showPreview ? "Hide Preview" : "Show Preview"}
                    </Button>
                  </div>
                  <Input
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Template name"
                    className="bg-input border-border"
                  />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={saveTemplateToLocal} className="flex-1 max-w-[140px]">
                      Save Template
                    </Button>
                    <select
                      className="bg-input border border-border rounded-md px-3 py-2 text-sm max-w-[140px]"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) applyTemplate(e.target.value)
                        e.target.value = ""
                      }}
                    >
                      <option value="">Load template...</option>
                      {templates.map((tpl) => (
                        <option key={tpl.name} value={tpl.name}>
                          {tpl.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Templates are saved locally in your browser. They are not shared with the backend.
                  </p>
                </div>

                <div className="border border-border rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold text-sm">Send timing</h4>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="sendMode"
                        value="now"
                        checked={sendMode === "now"}
                        onChange={() => setSendMode("now")}
                      />
                      Send now
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="sendMode"
                        value="schedule"
                        checked={sendMode === "schedule"}
                        onChange={() => setSendMode("schedule")}
                      />
                      Schedule in MailerLite
                    </label>
                    {sendMode === "schedule" && (
                      <input
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                        className="bg-input border border-border rounded-md px-3 py-2 text-sm"
                      />
                    )}
                    <p className="text-xs text-muted-foreground">
                      This will create the campaign and schedule it at the time you pick using MailerLite&apos;s \"Send later\" feature.
                    </p>
                  </div>
                </div>
              </div>

              {/* Preview */}
              {showPreview && (
                <div className="border border-border rounded-lg p-4 space-y-3 bg-card/50">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-sm">Live preview</h4>
                    <span className="text-xs text-muted-foreground">Subject: {subject || "—"}</span>
                  </div>
                  <div className="border border-border rounded-md bg-input/40 max-h-[520px] overflow-auto p-4">
                    {newsletterType === "text" ? (
                      <div
                        className="prose prose-invert max-w-none text-foreground"
                        dangerouslySetInnerHTML={{ __html: previewHtml || "<p class='text-muted-foreground'>Content preview...</p>" }}
                      />
                    ) : (
                      <div className="space-y-3">
                        <div
                          className="prose prose-invert max-w-none text-foreground"
                          dangerouslySetInnerHTML={{
                            __html: previewHtml || "<p class='text-muted-foreground'>Upload a poster and add body text to preview.</p>",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {sendStatus && (
                <div className={`p-4 rounded-lg ${sendStatus.type === "error" ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                  {sendStatus.message}
                </div>
              )}

              <div className="flex items-center gap-4 pt-2">
                <Button
                  type="submit"
                  disabled={sending || uploading || !subject.trim() || (newsletterType === "poster" ? !posterUrl : !stripHtml(content))}
                  className="bg-primary hover:bg-primary/90"
                >
                  {sending ? "Sending..." : "Send Newsletter"}
                </Button>
                <span className="text-sm text-muted-foreground">
                  {sendMode === "schedule"
                    ? "Schedules delivery; if scheduling fails it will send now."
                    : "Sends immediately to all active subscribers."}
                </span>
              </div>
            </form>
          </div>
        )}

        {/* SUBSCRIBERS TAB */}
        {activeTab === "subscribers" && (
          <div>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold">Subscribers</h2>
                <p className="text-muted-foreground mt-1">
                  {subscriberCount || 0} total subscribers
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button onClick={exportSubscribers} variant="outline" className="gap-2">
                  <Download size={16} />
                  Export CSV
                </Button>
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

            {/* GDPR Notice */}
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-400">
                <strong>GDPR Compliance:</strong> Use the delete button to permanently remove subscriber data upon request. Export CSV for data portability requests.
              </p>
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
                        <th className="p-4 font-medium text-right">Actions</th>
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
                          <td className="p-4 text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteSubscriber(sub.id, sub.email)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                            >
                              <Trash2 size={14} />
                            </Button>
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

        {/* EVENTS TAB */}
        {activeTab === "events" && (
          <div className="space-y-6">
            {/* Events Header */}
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold">Events & Shows</h2>
                <p className="text-muted-foreground mt-1">
                  {events.filter(e => !e.is_past).length} upcoming, {events.filter(e => e.is_past).length} past shows
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={openNewEvent} className="gap-2 bg-primary">
                  <Plus size={16} />
                  Add Event
                </Button>
                <Button onClick={fetchEvents} variant="outline" disabled={loadingEvents} className="gap-2">
                  <RefreshCw size={16} className={loadingEvents ? "animate-spin" : ""} />
                  Refresh
                </Button>
              </div>
            </div>

            {eventStatus && (
              <div className={`p-4 rounded-lg ${eventStatus.type === "error" ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                {eventStatus.message}
              </div>
            )}

            {loadingEvents ? (
              <div className="text-center py-16 text-muted-foreground">
                <Loader2 size={32} className="animate-spin mx-auto mb-4" />
                Loading events...
              </div>
            ) : events.length === 0 ? (
              <div className="bg-card border border-border rounded-lg p-16 text-center">
                <Calendar size={48} className="mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No events yet</h3>
                <p className="text-muted-foreground mb-4">Add your first event or show</p>
                <Button onClick={openNewEvent} className="gap-2">
                  <Plus size={16} />
                  Add Event
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Upcoming Events */}
                {events.filter(e => !e.is_past).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Upcoming Shows
                    </h3>
                    <div className="bg-card border border-border rounded-lg divide-y divide-border">
                      {events.filter(e => !e.is_past).map(event => (
                        <div key={event.id} className="p-4 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                          <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex flex-col items-center justify-center">
                            <span className="text-xs text-muted-foreground uppercase">
                              {new Date(event.date).toLocaleDateString("en-US", { month: "short" })}
                            </span>
                            <span className="text-xl font-bold">
                              {new Date(event.date).getDate()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{event.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <MapPin size={14} />
                              <span className="truncate">{event.venue}, {event.city}</span>
                            </div>
                            {event.time && (
                              <p className="text-xs text-muted-foreground mt-1">{event.time}</p>
                            )}
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {event.ticket_url && (
                              <a href={event.ticket_url} target="_blank" rel="noopener noreferrer">
                                <Button size="sm" variant="outline" className="gap-1">
                                  <Ticket size={14} />
                                  Tickets
                                </Button>
                              </a>
                            )}
                            <Button size="sm" variant="outline" onClick={() => openEditEvent(event)}>
                              <Edit size={14} />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => deleteEvent(event.id)} className="text-red-400 hover:text-red-300">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Events */}
                {events.filter(e => e.is_past).length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full"></span>
                      Past Shows
                    </h3>
                    <div className="bg-card border border-border rounded-lg divide-y divide-border opacity-70">
                      {events.filter(e => e.is_past).map(event => (
                        <div key={event.id} className="p-4 flex items-center gap-4 hover:bg-muted/20 transition-colors">
                          <div className="flex-shrink-0 w-16 h-16 bg-muted rounded-lg flex flex-col items-center justify-center">
                            <span className="text-xs text-muted-foreground uppercase">
                              {new Date(event.date).toLocaleDateString("en-US", { month: "short" })}
                            </span>
                            <span className="text-xl font-bold text-muted-foreground">
                              {new Date(event.date).getDate()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold truncate">{event.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              <MapPin size={14} />
                              <span className="truncate">{event.venue}, {event.city}</span>
                            </div>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            <Button size="sm" variant="outline" onClick={() => openEditEvent(event)}>
                              <Edit size={14} />
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => deleteEvent(event.id)} className="text-red-400 hover:text-red-300">
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Event Modal */}
            {showEventModal && (
              <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                <div className="bg-card border border-border rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-card">
                    <h3 className="text-lg font-bold">{editingEvent ? "Edit Event" : "Add New Event"}</h3>
                    <button onClick={() => setShowEventModal(false)} className="text-muted-foreground hover:text-foreground">
                      <X size={20} />
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Event Title *</label>
                      <Input
                        type="text"
                        placeholder="e.g., Jon Spirit Live"
                        value={eventForm.title}
                        onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))}
                        className="bg-input border-border"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Venue *</label>
                        <Input
                          type="text"
                          placeholder="e.g., The Warehouse"
                          value={eventForm.venue}
                          onChange={(e) => setEventForm(prev => ({ ...prev, venue: e.target.value }))}
                          className="bg-input border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">City *</label>
                        <Input
                          type="text"
                          placeholder="e.g., London, UK"
                          value={eventForm.city}
                          onChange={(e) => setEventForm(prev => ({ ...prev, city: e.target.value }))}
                          className="bg-input border-border"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Date *</label>
                        <Input
                          type="date"
                          value={eventForm.date}
                          onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                          className="bg-input border-border"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Time <span className="text-muted-foreground font-normal">(optional)</span></label>
                        <Input
                          type="text"
                          placeholder="e.g., 8:00 PM"
                          value={eventForm.time}
                          onChange={(e) => setEventForm(prev => ({ ...prev, time: e.target.value }))}
                          className="bg-input border-border"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Ticket Link <span className="text-muted-foreground font-normal">(optional)</span></label>
                      <Input
                        type="url"
                        placeholder="https://tickets.example.com/..."
                        value={eventForm.ticket_url}
                        onChange={(e) => setEventForm(prev => ({ ...prev, ticket_url: e.target.value }))}
                        className="bg-input border-border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Description <span className="text-muted-foreground font-normal">(optional)</span></label>
                      <textarea
                        placeholder="Additional details about the event..."
                        value={eventForm.description}
                        onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                      />
                    </div>
                    <div className="flex items-center gap-3 pt-2">
                      <input
                        type="checkbox"
                        id="isPast"
                        checked={eventForm.is_past}
                        onChange={(e) => setEventForm(prev => ({ ...prev, is_past: e.target.checked }))}
                        className="w-4 h-4 accent-primary"
                      />
                      <label htmlFor="isPast" className="text-sm">
                        Mark as past show
                      </label>
                    </div>
                  </div>
                  <div className="p-6 border-t border-border flex gap-3 justify-end sticky bottom-0 bg-card">
                    <Button variant="outline" onClick={() => setShowEventModal(false)}>Cancel</Button>
                    <Button
                      onClick={saveEvent}
                      disabled={savingEvent || !eventForm.title || !eventForm.venue || !eventForm.city || !eventForm.date}
                      className="gap-2"
                    >
                      {savingEvent ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      {savingEvent ? "Saving..." : editingEvent ? "Update Event" : "Create Event"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === "settings" && (
          <div className="max-w-3xl">
            {/* Settings Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Site Settings</h2>
                <p className="text-muted-foreground mt-1">
                  Manage social links, streaming links, and SEO settings
                </p>
              </div>
              <Button onClick={saveSettings} disabled={savingSettings} className="gap-2">
                {savingSettings ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                {savingSettings ? "Saving..." : "Save Changes"}
              </Button>
            </div>

            {settingsStatus && (
              <div className={`p-4 rounded-lg mb-6 ${settingsStatus.type === "error" ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
                {settingsStatus.message}
              </div>
            )}

            {loadingSettings ? (
              <div className="text-center py-16 text-muted-foreground">
                <Loader2 size={32} className="animate-spin mx-auto mb-4" />
                Loading settings...
              </div>
            ) : (
              <div className="space-y-8">
                {/* Social Links */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Globe size={20} className="text-primary" />
                    Social Links
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Instagram URL</label>
                      <Input
                        type="url"
                        placeholder="https://instagram.com/..."
                        value={siteSettings.instagram_url || ""}
                        onChange={(e) => updateSetting("instagram_url", e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Twitter / X URL</label>
                      <Input
                        type="url"
                        placeholder="https://twitter.com/..."
                        value={siteSettings.twitter_url || ""}
                        onChange={(e) => updateSetting("twitter_url", e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">TikTok URL</label>
                      <Input
                        type="url"
                        placeholder="https://tiktok.com/@..."
                        value={siteSettings.tiktok_url || ""}
                        onChange={(e) => updateSetting("tiktok_url", e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">YouTube URL</label>
                      <Input
                        type="url"
                        placeholder="https://youtube.com/@..."
                        value={siteSettings.youtube_url || ""}
                        onChange={(e) => updateSetting("youtube_url", e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                  </div>
                </div>

                {/* Streaming Links */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Link2 size={20} className="text-primary" />
                    Streaming Platforms
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Spotify Artist URL</label>
                      <Input
                        type="url"
                        placeholder="https://open.spotify.com/artist/..."
                        value={siteSettings.spotify_url || ""}
                        onChange={(e) => updateSetting("spotify_url", e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Apple Music URL</label>
                      <Input
                        type="url"
                        placeholder="https://music.apple.com/artist/..."
                        value={siteSettings.apple_music_url || ""}
                        onChange={(e) => updateSetting("apple_music_url", e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">SoundCloud URL</label>
                      <Input
                        type="url"
                        placeholder="https://soundcloud.com/..."
                        value={siteSettings.soundcloud_url || ""}
                        onChange={(e) => updateSetting("soundcloud_url", e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                  </div>
                </div>

                {/* SEO Settings */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Search size={20} className="text-primary" />
                    SEO Settings
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Site Title</label>
                      <Input
                        type="text"
                        placeholder="Jon Spirit - Official Website"
                        value={siteSettings.site_title || ""}
                        onChange={(e) => updateSetting("site_title", e.target.value)}
                        className="bg-input border-border"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Appears in browser tabs and search results</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Site Description</label>
                      <textarea
                        placeholder="Official website of Jon Spirit..."
                        value={siteSettings.site_description || ""}
                        onChange={(e) => updateSetting("site_description", e.target.value)}
                        rows={3}
                        className="w-full bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Used for search engine results</p>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="bg-card border border-border rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Mail size={20} className="text-primary" />
                    Contact
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Contact Email</label>
                      <Input
                        type="email"
                        placeholder="contact@example.com"
                        value={siteSettings.contact_email || ""}
                        onChange={(e) => updateSetting("contact_email", e.target.value)}
                        className="bg-input border-border"
                      />
                    </div>
                  </div>
                </div>

                {/* Save Button (bottom) */}
                <div className="flex justify-end">
                  <Button onClick={saveSettings} disabled={savingSettings} className="gap-2">
                    {savingSettings ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {savingSettings ? "Saving..." : "Save All Changes"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {/* Analytics Header */}
            <div>
              <h2 className="text-2xl font-bold">Analytics Overview</h2>
              <p className="text-muted-foreground mt-1">
                Site performance and engagement metrics
              </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Music size={20} className="text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Total Songs</span>
                </div>
                <p className="text-3xl font-bold">{totalTracks}</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Users size={20} className="text-green-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Subscribers</span>
                </div>
                <p className="text-3xl font-bold">{subscriberCount ?? 0}</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Calendar size={20} className="text-blue-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Upcoming Events</span>
                </div>
                <p className="text-3xl font-bold">{events.filter(e => !e.is_past).length}</p>
              </div>

              <div className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Disc size={20} className="text-purple-500" />
                  </div>
                  <span className="text-sm text-muted-foreground">Albums/Releases</span>
                </div>
                <p className="text-3xl font-bold">{albums.length}</p>
              </div>
            </div>

            {/* Newsletter performance */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">Newsletter performance</h3>
                  <p className="text-muted-foreground text-sm">Opens and clicks for recent sends</p>
                </div>
                <Button variant="outline" size="sm" onClick={fetchNewsletterStats} disabled={loadingNewsletterStats}>
                  {loadingNewsletterStats ? "Loading..." : "Refresh"}
                </Button>
              </div>

              {loadingNewsletterStats ? (
                <div className="text-muted-foreground text-sm">Loading newsletter stats...</div>
              ) : newsletterStats.length === 0 ? (
                <div className="text-muted-foreground text-sm">No newsletter sends recorded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="py-2 pr-4 font-medium">Subject</th>
                        <th className="py-2 pr-4 font-medium">Status</th>
                        <th className="py-2 pr-4 font-medium">Sent/Scheduled</th>
                        <th className="py-2 pr-4 font-medium">Opens</th>
                        <th className="py-2 pr-4 font-medium">Clicks</th>
                        <th className="py-2 pr-4 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newsletterStats.map((stat) => (
                        <tr key={stat.id} className="border-b border-border/50">
                          <td className="py-2 pr-4 font-medium truncate max-w-[280px]">{stat.subject}</td>
                          <td className="py-2 pr-4 capitalize">{stat.status}</td>
                          <td className="py-2 pr-4 text-muted-foreground">
                            {stat.sent_at
                              ? new Date(stat.sent_at).toLocaleString()
                              : stat.scheduled_at
                                ? `Scheduled ${new Date(stat.scheduled_at).toLocaleString()}`
                                : "—"}
                          </td>
                          <td className="py-2 pr-4">{stat.open_count ?? 0}</td>
                          <td className="py-2 pr-4">{stat.click_count ?? 0}</td>
                          <td className="py-2 pr-4">
                            <div className="flex flex-wrap gap-2">
                              {stat.status === "scheduled" && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      if (!confirm(`Cancel scheduled newsletter "${stat.subject}"?`)) return
                                      try {
                                        const res = await fetch(`/api/admin/newsletter/${stat.id}`, {
                                          method: "POST",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ action: "cancel" }),
                                        })
                                        if (!res.ok) {
                                          const data = await res.json().catch(() => ({}))
                                          throw new Error(data.error || "Failed to cancel")
                                        }
                                        setNewsletterStats((prev) =>
                                          prev.map((s) => (s.id === stat.id ? { ...s, status: "cancelled" } : s))
                                        )
                                        setSendStatus({
                                          type: "success",
                                          message:
                                            "Scheduled newsletter cancelled in your dashboard. If it was already scheduled in MailerLite, cancel it there too.",
                                        })
                                      } catch (error) {
                                        console.error(error)
                                        setSendStatus({ type: "error", message: "Failed to cancel scheduled newsletter" })
                                      }
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={async () => {
                                      if (!confirm(`Delete scheduled newsletter "${stat.subject}" from history?`)) return
                                      try {
                                        const res = await fetch(`/api/admin/newsletter/${stat.id}`, {
                                          method: "DELETE",
                                        })
                                        if (!res.ok) {
                                          const data = await res.json().catch(() => ({}))
                                          throw new Error(data.error || "Failed to delete")
                                        }
                                        setNewsletterStats((prev) => prev.filter((s) => s.id !== stat.id))
                                        setSendStatus({
                                          type: "success",
                                          message:
                                            "Scheduled newsletter removed from history. If it was scheduled in MailerLite, delete/cancel it there too.",
                                        })
                                      } catch (error) {
                                        console.error(error)
                                        setSendStatus({ type: "error", message: "Failed to delete scheduled newsletter" })
                                      }
                                    }}
                                  >
                                    Delete
                                  </Button>
                                </>
                              )}
                              {stat.status === "sent" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    if (!confirm(`Delete sent newsletter "${stat.subject}" from history?`)) return
                                    try {
                                      const res = await fetch(`/api/admin/newsletter/${stat.id}`, {
                                        method: "DELETE",
                                      })
                                      if (!res.ok) {
                                        const data = await res.json().catch(() => ({}))
                                        throw new Error(data.error || "Failed to delete")
                                      }
                                      setNewsletterStats((prev) => prev.filter((s) => s.id !== stat.id))
                                      setSendStatus({
                                        type: "success",
                                        message: "Sent newsletter removed from history (MailerLite stats remain there).",
                                      })
                                    } catch (error) {
                                      console.error(error)
                                      setSendStatus({ type: "error", message: "Failed to delete sent newsletter" })
                                    }
                                  }}
                                >
                                  Delete
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* External Analytics Links */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-primary" />
                Detailed Analytics
              </h3>
              <p className="text-muted-foreground mb-6">
                For detailed visitor analytics, page views, and engagement metrics, use the external dashboards below.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <a
                  href="https://vercel.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="p-2 bg-foreground/10 rounded-lg">
                    <BarChart3 size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium group-hover:text-primary transition-colors">Vercel Analytics</p>
                    <p className="text-xs text-muted-foreground">Page views & performance</p>
                  </div>
                  <ExternalLink size={16} className="text-muted-foreground" />
                </a>

                <a
                  href="https://dashboard.mailerlite.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <Mail size={20} className="text-green-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium group-hover:text-primary transition-colors">MailerLite</p>
                    <p className="text-xs text-muted-foreground">Email open & click rates</p>
                  </div>
                  <ExternalLink size={16} className="text-muted-foreground" />
                </a>

                <a
                  href="https://artists.spotify.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors group"
                >
                  <div className="p-2 bg-green-600/10 rounded-lg">
                    <Music size={20} className="text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium group-hover:text-primary transition-colors">Spotify for Artists</p>
                    <p className="text-xs text-muted-foreground">Streams & listener data</p>
                  </div>
                  <ExternalLink size={16} className="text-muted-foreground" />
                </a>
              </div>
            </div>

            {/* Content Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Music Summary */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Music size={20} className="text-primary" />
                  Music Library
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Total Tracks</span>
                    <span className="font-semibold">{totalTracks}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Albums & Singles</span>
                    <span className="font-semibold">{albums.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Manual Uploads</span>
                    <span className="font-semibold">{manualSongs.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Tracks with Custom Audio</span>
                    <span className="font-semibold text-green-400">
                      {Object.values(overrides).filter(o => o?.audio_url).length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Events Summary */}
              <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-primary" />
                  Events
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Total Events</span>
                    <span className="font-semibold">{events.length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border/50">
                    <span className="text-muted-foreground">Upcoming Shows</span>
                    <span className="font-semibold text-green-400">{events.filter(e => !e.is_past).length}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-muted-foreground">Past Shows</span>
                    <span className="font-semibold text-muted-foreground">{events.filter(e => e.is_past).length}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
