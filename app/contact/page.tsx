"use client"
import Navigation from "@/components/navigation"
import type React from "react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { Send, Clock, Mic, Newspaper, CheckCircle } from "lucide-react"

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "booking",
    message: "",
  })
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState("")

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSending(true)
    setError("")

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        setSubmitted(true)
        setFormData({ name: "", email: "", subject: "booking", message: "" })
        setTimeout(() => setSubmitted(false), 5000)
      } else {
        setError(data.error || "Failed to send message")
      }
    } catch {
      setError("Network error. Please try again.")
    }
    
    setSending(false)
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navigation />

      <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-16 py-12">
        <h1 className="text-5xl md:text-6xl font-black mb-2 text-foreground tracking-tighter animate-fade-in-up">
          BOOKING & FEATURES
        </h1>
        <p className="text-primary text-lg mb-12 font-semibold animate-fade-in-up stagger-2">
          Summon the spirit. Let's collaborate.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Contact Info */}
          <div className="space-y-6 animate-slide-in-left">
            <div className="bg-card rounded-lg p-8 border border-border hover-lift">
              <div className="flex items-center gap-3 mb-3">
                <Mic className="text-accent" size={20} />
                <h3 className="text-lg font-bold text-accent">BOOKING INFO</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Interested in booking Jon Spirit for a feature, collaboration, or event? Submit the form with your
                details and we'll get back to you within 48 hours.
              </p>
            </div>

            <div className="bg-card rounded-lg p-8 border border-border hover-lift">
              <div className="flex items-center gap-3 mb-3">
                <Clock className="text-primary" size={20} />
                <h3 className="text-lg font-bold text-primary">RESPONSE TIME</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                We respond to all booking inquiries within 24-48 hours. Make sure your email address is correct so we
                can reach you.
              </p>
            </div>

            <div className="bg-card rounded-lg p-8 border border-border hover-lift">
              <div className="flex items-center gap-3 mb-3">
                <Newspaper className="text-accent" size={20} />
                <h3 className="text-lg font-bold text-accent">PRESS & MEDIA</h3>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                For press inquiries, interviews, and media requests, select "Press" in the Subject dropdown.
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2 animate-slide-in-right">
            <div className="bg-card rounded-lg p-8 border border-border">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="animate-fade-in-up stagger-1">
                  <label htmlFor="name" className="block text-sm font-semibold text-foreground mb-2">
                    NAME
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-300"
                    placeholder="Your name"
                  />
                </div>

                <div className="animate-fade-in-up stagger-2">
                  <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                    EMAIL
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-300"
                    placeholder="your@email.com"
                  />
                </div>

                <div className="animate-fade-in-up stagger-3">
                  <label htmlFor="subject" className="block text-sm font-semibold text-foreground mb-2">
                    SUBJECT
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-300"
                  >
                    <option value="booking">Booking Inquiry</option>
                    <option value="feature">Feature Request</option>
                    <option value="press">Press & Media</option>
                    <option value="collaboration">Collaboration</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="animate-fade-in-up stagger-4">
                  <label htmlFor="message" className="block text-sm font-semibold text-foreground mb-2">
                    MESSAGE
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full bg-background border border-border text-foreground rounded-lg px-4 py-3 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-all duration-300 resize-none"
                    placeholder="Tell us about your inquiry..."
                  />
                </div>

                {error && (
                  <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 text-center">
                    <p className="text-red-400 font-semibold">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={sending}
                  className="w-full py-6 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 hover-glow flex items-center justify-center gap-2 animate-fade-in-up stagger-5 disabled:opacity-50"
                >
                  {sending ? (
                    "SENDING..."
                  ) : submitted ? (
                    <>
                      <CheckCircle size={20} />
                      SPIRIT SUMMONED!
                    </>
                  ) : (
                    <>
                      <Send size={20} />
                      SUMMON SPIRIT
                    </>
                  )}
                </Button>

                {submitted && (
                  <div className="bg-primary/20 border border-primary rounded-lg p-4 text-center animate-fade-in-scale">
                    <p className="text-primary font-semibold">Message sent to info@jonspirit.com! We'll be in touch within 48 hours.</p>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
