"use client"

import Navigation from "@/components/navigation"
import NewsletterForm from "@/components/newsletter-form"
import { useState, useEffect } from "react"
import { Loader2, MapPin, Calendar, Ticket, Clock, ChevronDown } from "lucide-react"

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
}

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [showPastEvents, setShowPastEvents] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/events")
        if (res.ok) {
          const data = await res.json()
          setEvents(data.events || [])
        }
      } catch (error) {
        console.error("Failed to fetch events:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchEvents()
  }, [])

  const upcomingEvents = events.filter(e => !e.is_past)
  const pastEvents = events.filter(e => e.is_past)
  const nextEvent = upcomingEvents[0]

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      day: date.getDate(),
      month: date.toLocaleDateString("en-US", { month: "short" }).toUpperCase(),
      year: date.getFullYear(),
      weekday: date.toLocaleDateString("en-US", { weekday: "long" }),
      full: date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16 py-6 md:py-12">
        {/* Header */}
        <h1 className="text-3xl sm:text-4xl md:text-6xl font-black mb-8 md:mb-12 text-foreground tracking-tighter">
          LIVE SHOWS
        </h1>

        {/* Hero - Next Event */}
        {nextEvent && (
          <section className="mb-12 md:mb-16">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-card to-card border border-border">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]"></div>
              <div className="relative p-6 md:p-10 lg:p-12">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                  {/* Date Block */}
                  <div className="flex-shrink-0 bg-background/80 backdrop-blur-sm rounded-xl p-6 text-center border border-border/50 shadow-xl">
                    <span className="text-sm font-bold text-primary tracking-widest">
                      {formatDate(nextEvent.date).month}
                    </span>
                    <div className="text-5xl md:text-7xl font-black text-foreground my-1">
                      {formatDate(nextEvent.date).day}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {formatDate(nextEvent.date).weekday}
                    </span>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1">
                    <span className="inline-block px-3 py-1 bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider rounded-full mb-4">
                      Next Show
                    </span>
                    <h2 className="text-2xl md:text-4xl lg:text-5xl font-black text-foreground mb-4">
                      {nextEvent.title}
                    </h2>
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <MapPin size={18} className="text-primary" />
                        <span className="text-lg">{nextEvent.venue}</span>
                      </div>
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <Calendar size={18} className="text-primary" />
                        <span>{nextEvent.city}</span>
                      </div>
                      {nextEvent.time && (
                        <div className="flex items-center gap-3 text-muted-foreground">
                          <Clock size={18} className="text-primary" />
                          <span>{nextEvent.time}</span>
                        </div>
                      )}
                    </div>
                    {nextEvent.description && (
                      <p className="text-muted-foreground mb-6 max-w-2xl">
                        {nextEvent.description}
                      </p>
                    )}
                    {nextEvent.ticket_url && (
                      <a
                        href={nextEvent.ticket_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-8 py-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-full transition-all transform hover:scale-105 shadow-lg"
                      >
                        <Ticket size={20} />
                        GET TICKETS
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* No Events Message */}
        {events.length === 0 && (
          <div className="text-center py-20">
            <Calendar size={64} className="mx-auto mb-6 text-muted-foreground" />
            <h2 className="text-2xl font-bold text-foreground mb-3">No Shows Scheduled</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Sign up for the newsletter to be first to know when new shows are announced.
            </p>
          </div>
        )}

        {/* Upcoming Events Grid */}
        {upcomingEvents.length > 1 && (
          <section className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold mb-6 text-foreground flex items-center gap-2">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              Upcoming Shows
            </h2>
            <div className="grid gap-4">
              {upcomingEvents.slice(1).map((event) => {
                const date = formatDate(event.date)
                return (
                  <div
                    key={event.id}
                    className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 md:p-6 bg-card border border-border rounded-xl hover:border-primary/50 transition-all"
                  >
                    {/* Date */}
                    <div className="flex-shrink-0 w-16 text-center">
                      <span className="text-xs font-bold text-primary tracking-wider">
                        {date.month}
                      </span>
                      <div className="text-3xl font-black text-foreground">
                        {date.day}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                        {event.title}
                      </h3>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin size={14} />
                          {event.venue}
                        </span>
                        <span>{event.city}</span>
                        {event.time && <span>{event.time}</span>}
                      </div>
                    </div>

                    {/* Action */}
                    {event.ticket_url ? (
                      <a
                        href={event.ticket_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-full transition-all text-sm"
                      >
                        <Ticket size={16} />
                        Tickets
                      </a>
                    ) : (
                      <span className="px-5 py-2.5 bg-muted text-muted-foreground font-medium rounded-full text-sm">
                        Free Entry
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Past Events */}
        {pastEvents.length > 0 && (
          <section className="mb-12">
            <button
              onClick={() => setShowPastEvents(!showPastEvents)}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ChevronDown
                size={20}
                className={`transition-transform ${showPastEvents ? "rotate-180" : ""}`}
              />
              <span className="text-lg font-semibold">Past Shows ({pastEvents.length})</span>
            </button>

            {showPastEvents && (
              <div className="grid gap-3 opacity-70">
                {pastEvents.map((event) => {
                  const date = formatDate(event.date)
                  return (
                    <div
                      key={event.id}
                      className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-card/50 border border-border/50 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-16 text-center">
                        <span className="text-xs text-muted-foreground tracking-wider">
                          {date.month} {date.year}
                        </span>
                        <div className="text-2xl font-bold text-muted-foreground">
                          {date.day}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground/80">
                          {event.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {event.venue}, {event.city}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {/* Newsletter CTA */}
        <div className="bg-card border border-border rounded-lg p-8 md:p-12 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            NEVER MISS A SHOW
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Get notified about upcoming shows, ticket sales, and exclusive events.
          </p>
          <NewsletterForm />
        </div>
      </div>
    </div>
  )
}

