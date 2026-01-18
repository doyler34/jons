"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, Music, Check, X, Loader2, ArrowLeft, Download, Trash2, Search } from "lucide-react"
import { upload } from "@vercel/blob/client"

interface ManualSong {
  id: string
  title: string
  album_name: string
  audio_url: string
  cover_url: string | null
  created_at: string
}

interface SpotifyTrack {
  id: string
  name: string
  album: {
    name: string
    images: { url: string }[]
  }
}

interface SongOverride {
  id: number
  spotify_id: string
  audio_url: string | null
  cover_url: string | null
}

interface CombinedSong {
  id: string
  title: string
  album_name: string
  audio_url: string | null
  cover_url: string | null
  type: "manual" | "spotify"
  spotify_id?: string
}

interface UploadedFile {
  originalName: string
  blobUrl: string
  filename: string
  assignTo: "new" | string
  newTitle: string
  newAlbum: string
}

export default function BulkUploadPage() {
  const router = useRouter()
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [manualSongs, setManualSongs] = useState<ManualSong[]>([])
  const [allSongs, setAllSongs] = useState<CombinedSong[]>([])
  const [filteredSongs, setFilteredSongs] = useState<CombinedSong[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [bulkFiles, setBulkFiles] = useState<File[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const bulkFilesRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredSongs(allSongs)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredSongs(
        allSongs.filter(
          (song) =>
            song.title.toLowerCase().includes(query) ||
            song.album_name.toLowerCase().includes(query)
        )
      )
    }
  }, [searchQuery, allSongs])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/admin/auth")
      if (response.ok) {
        setAuthenticated(true)
        fetchManualSongs()
      } else {
        router.push("/spirit-admin-x7k9/login")
      }
    } catch {
      router.push("/spirit-admin-x7k9/login")
    }
  }

  const fetchManualSongs = async () => {
    setLoading(true)
    try {
      // Fetch manual songs, Spotify tracks, and overrides
      const [manualRes, spotifyRes, overridesRes] = await Promise.all([
        fetch("/api/songs/manual"),
        fetch("/api/spotify"),
        fetch("/api/songs/overrides")
      ])

      const manualData = manualRes.ok ? await manualRes.json() : { songs: [] }
      const spotifyData = spotifyRes.ok ? await spotifyRes.json() : { albumsWithTracks: [] }
      const overridesData = overridesRes.ok ? await overridesRes.json() : { overrides: {} }

      console.log("Fetched manual songs:", manualData)
      console.log("Fetched Spotify tracks:", spotifyData)
      console.log("Fetched overrides:", overridesData)

      setManualSongs(manualData.songs || [])

      // Combine manual songs and Spotify tracks with custom audio
      const combined: CombinedSong[] = []

      // Add manual songs
      manualData.songs?.forEach((song: ManualSong) => {
        combined.push({
          id: `manual-${song.id}`,
          title: song.title,
          album_name: song.album_name,
          audio_url: song.audio_url,
          cover_url: song.cover_url,
          type: "manual"
        })
      })

      // Add Spotify tracks that have custom audio
      const overrides = overridesData.overrides || {}
      spotifyData.albumsWithTracks?.forEach((album: any) => {
        album.tracks?.forEach((track: SpotifyTrack) => {
          const override = overrides[track.id]
          if (override && override.audio_url) {
            combined.push({
              id: `spotify-${track.id}`,
              title: track.name,
              album_name: track.album.name,
              audio_url: override.audio_url,
              cover_url: override.cover_url || track.album.images[0]?.url || null,
              type: "spotify",
              spotify_id: track.id
            })
          }
        })
      })

      console.log("Combined songs:", combined)
      setAllSongs(combined)
      setFilteredSongs(combined)
    } catch (error) {
      console.error("Failed to fetch songs:", error)
      setStatus({ type: "error", message: `Error: ${error}` })
    } finally {
      setLoading(false)
    }
  }

  const handleBulkFileUpload = async () => {
    if (bulkFiles.length === 0) {
      setStatus({ type: "error", message: "Please select files to upload" })
      return
    }

    setUploading(true)
    setStatus(null)

    try {
      const uploadedFiles: Array<{
        originalName: string
        blobUrl: string
        filename: string
        assignTo: "new" | string
        newTitle: string
        newAlbum: string
      }> = []

      // Upload each file directly to Vercel Blob (client-side)
      for (let i = 0; i < bulkFiles.length; i++) {
        const file = bulkFiles[i]
        setStatus({ type: "success", message: `Uploading ${i + 1}/${bulkFiles.length}: ${file.name}...` })

        // Generate unique filename
        const timestamp = Date.now()
        const random = Math.random().toString(36).substring(7)
        const extension = file.name.split(".").pop() || "mp3"
        const filename = `song-${timestamp}-${random}.${extension}`

        // Upload directly to Vercel Blob
        const blob = await upload(filename, file, {
          access: "public",
          handleUploadUrl: "/api/admin/upload-token",
        })

        uploadedFiles.push({
          originalName: file.name,
          blobUrl: blob.url,
          filename: filename,
          assignTo: "new",
          newTitle: file.name.replace(/\.(mp3|wav|m4a|ogg)$/i, ""),
          newAlbum: "Singles",
        })
      }

      setUploadedFiles(uploadedFiles)
      setBulkFiles([])
      if (bulkFilesRef.current) bulkFilesRef.current.value = ""
      setStatus({ type: "success", message: `Successfully uploaded ${uploadedFiles.length} files` })
    } catch (error) {
      console.error("Bulk upload error:", error)
      setStatus({ type: "error", message: error instanceof Error ? error.message : "Upload failed" })
    } finally {
      setUploading(false)
    }
  }

  const handleSaveAssignments = async () => {
    if (uploadedFiles.length === 0) return

    setSaving(true)
    setStatus(null)

    try {
      const results = []

      for (const file of uploadedFiles) {
        if (file.assignTo === "new") {
          // Create new manual song
          const res = await fetch("/api/songs/manual", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              title: file.newTitle,
              album_name: file.newAlbum || "Singles",
              audio_url: file.blobUrl,
              cover_url: null,
            }),
          })

          if (res.ok) {
            const data = await res.json()
            results.push(data.song)
          }
        } else {
          // Assign to existing song (manual or Spotify track)
          const songId = file.assignTo
          const isSpotifyTrack = songId.startsWith("spotify-")

          if (isSpotifyTrack) {
            // Update Spotify track override
            const spotifyId = songId.replace("spotify-", "")
            const res = await fetch(`/api/songs/overrides`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                spotify_id: spotifyId,
                audio_url: file.blobUrl,
              }),
            })

            if (res.ok) {
              results.push({ id: spotifyId })
            }
          } else {
            // Update manual song
            const actualId = songId.replace("manual-", "")
            const res = await fetch(`/api/songs/manual`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: actualId,
                audio_url: file.blobUrl,
              }),
            })

            if (res.ok) {
              results.push({ id: actualId })
            }
          }
        }
      }

      await fetchManualSongs()
      setStatus({ type: "success", message: `Successfully saved ${results.length} songs` })
      setUploadedFiles([])
      setBulkFiles([])
    } catch (error) {
      console.error("Save assignments error:", error)
      setStatus({ type: "error", message: "Failed to save some assignments" })
    } finally {
      setSaving(false)
    }
  }

  const deleteSong = async (song: CombinedSong) => {
    if (!confirm(`Remove audio from "${song.title}"?`)) return

    try {
      if (song.type === "manual") {
        // For manual songs, just remove the audio_url, don't delete the song
        const actualId = song.id.replace("manual-", "")
        const res = await fetch(`/api/songs/manual`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: actualId,
            audio_url: null,
          }),
        })
        
        if (res.ok) {
          // Update the song to show it has no audio
          setAllSongs((prev) => prev.map((s) => 
            s.id === song.id ? { ...s, audio_url: null } : s
          ))
          setStatus({ type: "success", message: "Audio removed from song" })
        }
      } else if (song.type === "spotify" && song.spotify_id) {
        // For Spotify tracks, remove the audio override
        const res = await fetch(`/api/songs/overrides?spotify_id=${song.spotify_id}&field=audio`, {
          method: "DELETE"
        })
        
        if (res.ok) {
          // Remove from list since it no longer has custom audio
          setAllSongs((prev) => prev.filter((s) => s.id !== song.id))
          setStatus({ type: "success", message: "Audio removed from Spotify track" })
        }
      }
    } catch (error) {
      setStatus({ type: "error", message: "Failed to remove audio" })
    }
  }

  const downloadFile = (url: string, fallbackName: string) => {
    const link = document.createElement("a")
    link.href = url
    link.download = fallbackName
    link.click()
  }

  if (authenticated === null || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/spirit-admin-x7k9")}
              className="gap-2"
            >
              <ArrowLeft size={16} />
              Back to Admin
            </Button>
            <h1 className="text-xl font-bold">Bulk Upload & Database Songs</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Status Message */}
        {status && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              status.type === "error"
                ? "bg-red-500/10 text-red-400"
                : "bg-green-500/10 text-green-400"
            }`}
          >
            {status.message}
          </div>
        )}

        {/* Bulk Upload Section */}
        <div className="bg-card border border-border rounded-lg p-6 mb-8">
          <h2 className="text-xl font-bold mb-4">Upload Multiple MP3 Files</h2>

          {uploadedFiles.length === 0 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Select MP3 Files (Max 10 files, 50MB each)
                </label>
                <input
                  ref={bulkFilesRef}
                  type="file"
                  accept="audio/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || [])
                    if (files.length > 10) {
                      setStatus({ type: "error", message: "Maximum 10 files allowed" })
                      return
                    }
                    setBulkFiles(files)
                  }}
                  className="block w-full text-sm text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-purple-600 file:text-white hover:file:bg-purple-700 file:cursor-pointer cursor-pointer"
                />
              </div>

              {bulkFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Selected files ({bulkFiles.length}):</p>
                  <div className="bg-muted/20 rounded-lg p-3 space-y-1 max-h-48 overflow-y-auto">
                    {bulkFiles.map((file, idx) => (
                      <div key={idx} className="text-xs text-green-400 flex items-center gap-2">
                        <Check size={12} />
                        {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={handleBulkFileUpload}
                    disabled={uploading}
                    className="gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                    {uploading ? "Uploading..." : `Upload ${bulkFiles.length} Files`}
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">
                  Assign audio files to songs ({uploadedFiles.length} files uploaded)
                </p>
                <Button
                  onClick={() => {
                    setUploadedFiles([])
                    setBulkFiles([])
                  }}
                  variant="outline"
                  size="sm"
                  className="gap-1"
                >
                  <X size={14} />
                  Clear All
                </Button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="bg-muted/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Music size={16} className="text-purple-400" />
                      <p className="font-medium text-sm">{file.originalName}</p>
                    </div>

                    <div className="space-y-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`assign-${idx}`}
                          checked={file.assignTo === "new"}
                          onChange={() => {
                            const updated = [...uploadedFiles]
                            updated[idx].assignTo = "new"
                            setUploadedFiles(updated)
                          }}
                          className="text-purple-600"
                        />
                        <span className="text-sm font-medium">Create New Song</span>
                      </label>

                      {file.assignTo === "new" && (
                        <div className="ml-6 space-y-2">
                          <Input
                            type="text"
                            placeholder="Song Title"
                            value={file.newTitle}
                            onChange={(e) => {
                              const updated = [...uploadedFiles]
                              updated[idx].newTitle = e.target.value
                              setUploadedFiles(updated)
                            }}
                            className="bg-input border-border text-sm"
                          />
                          <Input
                            type="text"
                            placeholder="Album Name (optional)"
                            value={file.newAlbum}
                            onChange={(e) => {
                              const updated = [...uploadedFiles]
                              updated[idx].newAlbum = e.target.value
                              setUploadedFiles(updated)
                            }}
                            className="bg-input border-border text-sm"
                          />
                        </div>
                      )}

                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={`assign-${idx}`}
                          checked={file.assignTo !== "new"}
                          onChange={() => {
                            const updated = [...uploadedFiles]
                            updated[idx].assignTo = allSongs[0]?.id || "new"
                            setUploadedFiles(updated)
                          }}
                          className="text-purple-600"
                          disabled={allSongs.length === 0}
                        />
                        <span className="text-sm font-medium">
                          Assign to Existing Song
                          {allSongs.length === 0 && " (No songs in database)"}
                        </span>
                      </label>

                      {file.assignTo !== "new" && allSongs.length > 0 && (
                        <div className="ml-6">
                          <select
                            value={file.assignTo}
                            onChange={(e) => {
                              const updated = [...uploadedFiles]
                              updated[idx].assignTo = e.target.value
                              setUploadedFiles(updated)
                            }}
                            className="w-full px-3 py-2 bg-input border border-border rounded-md text-sm"
                          >
                            {allSongs.map((song) => (
                              <option key={song.id} value={song.id}>
                                {song.title} - {song.album_name} ({song.type === "spotify" ? "Spotify" : "Manual"})
                                {!song.audio_url && " (No Audio)"}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                onClick={handleSaveAssignments}
                disabled={saving}
                className="gap-2 bg-purple-600 hover:bg-purple-700 w-full"
              >
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {saving ? "Saving..." : `Save All (${uploadedFiles.length})`}
              </Button>
            </div>
          )}
        </div>

        {/* Database Songs Section */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">All Songs in Database ({allSongs.length})</h2>
            <div className="relative w-64">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search songs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-input border-border"
              />
            </div>
          </div>

          {filteredSongs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {allSongs.length === 0 ? "No songs in database yet" : "No songs match your search"}
              </p>
              {allSongs.length === 0 && (
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Debug: Check browser console for errors</p>
                  <p>Or visit: <code className="bg-muted px-2 py-1 rounded">/api/debug/database</code></p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredSongs.map((song) => (
                <div
                  key={song.id}
                  className="flex items-center gap-4 p-4 rounded-lg hover:bg-muted/20 transition-colors"
                >
                  <img
                    src={song.cover_url || "/placeholder.svg"}
                    alt={song.title}
                    className="w-12 h-12 rounded object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{song.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{song.album_name}</p>
                    <div className="flex gap-2 mt-1">
                      {song.audio_url ? (
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                          ✓ Has Audio
                        </span>
                      ) : (
                        <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded">
                          ⚠ No Audio
                        </span>
                      )}
                      {song.type === "spotify" ? (
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded">
                          Spotify Track
                        </span>
                      ) : (
                        <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">
                          Manual Upload
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {song.audio_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => song.audio_url && downloadFile(song.audio_url, `${song.title}.mp3`)}
                        className="gap-1"
                      >
                        <Download size={14} />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSong(song)}
                      className="gap-1 text-red-400 hover:text-red-300"
                      title={song.type === "spotify" ? "Remove audio" : "Delete song"}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
