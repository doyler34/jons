"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function NewsletterForm() {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus("loading")
    setMessage("")

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus("success")
        setMessage(data.message || "Successfully subscribed!")
        setEmail("")
        setTimeout(() => {
          setStatus("idle")
          setMessage("")
        }, 4000)
      } else {
        setStatus("error")
        setMessage(data.error || "Something went wrong")
        setTimeout(() => {
          setStatus("idle")
          setMessage("")
        }, 4000)
      }
    } catch {
      setStatus("error")
      setMessage("Network error. Please try again.")
      setTimeout(() => {
        setStatus("idle")
        setMessage("")
      }, 4000)
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <Input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === "loading"}
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder:text-gray-500 focus:border-primary focus:ring-primary px-4 py-3 disabled:opacity-50"
          />
        </div>
        <Button
          type="submit"
          disabled={status === "loading"}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-3 transition-all duration-300 hover:shadow-lg hover:shadow-primary/50 disabled:opacity-50"
        >
          {status === "loading" ? "..." : status === "success" ? "✓ JOINED" : "JOIN"}
        </Button>
      </form>
      {message && (
        <p className={`text-sm mt-3 text-center ${status === "error" ? "text-red-400" : "text-green-400"}`}>
          {message}
        </p>
      )}
    </div>
  )
}
