"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { X, Cookie, Settings } from "lucide-react"

interface CookiePreferences {
  necessary: boolean
  functional: boolean
  analytics: boolean
  marketing: boolean
}

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true, // Always true, can't be disabled
    functional: true,
    analytics: true,
    marketing: true,
  })

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      // Delay showing popup slightly for better UX
      setTimeout(() => setIsVisible(true), 1000)
    }
  }, [])

  const savePreferences = (prefs: CookiePreferences) => {
    localStorage.setItem("cookie-consent", JSON.stringify(prefs))
    localStorage.setItem("cookie-consent-date", new Date().toISOString())
    setIsVisible(false)
    
    // Here you would initialize your analytics/marketing scripts based on preferences
    if (prefs.analytics) {
      // Initialize analytics (Google Analytics, etc.)
      console.log("Analytics cookies enabled")
    }
    if (prefs.marketing) {
      // Initialize marketing cookies
      console.log("Marketing cookies enabled")
    }
  }

  const acceptAll = () => {
    const allAccepted = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    }
    savePreferences(allAccepted)
  }

  const rejectAll = () => {
    const onlyNecessary = {
      necessary: true,
      functional: false,
      analytics: false,
      marketing: false,
    }
    savePreferences(onlyNecessary)
  }

  const saveCustom = () => {
    savePreferences(preferences)
  }

  if (!isVisible) return null

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9998]" />

      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6 animate-in slide-in-from-bottom duration-300">
        <div className="max-w-6xl mx-auto bg-card border-2 border-border rounded-2xl shadow-2xl">
          {!showSettings ? (
            // Main Cookie Banner
            <div className="p-6 md:p-8">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-xl">
                  <Cookie className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl md:text-2xl font-bold text-foreground mb-2">
                    We Value Your Privacy
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                    We use cookies and similar technologies to enhance your browsing experience, 
                    personalize content, provide social media features, and analyze our traffic. 
                    By clicking "Accept All", you consent to our use of cookies. You can customize 
                    your preferences or reject non-essential cookies.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={acceptAll}
                  className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Accept All
                </button>
                <button
                  onClick={rejectAll}
                  className="flex-1 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Reject All
                </button>
                <button
                  onClick={() => setShowSettings(true)}
                  className="flex-1 px-6 py-3 bg-card border-2 border-border hover:bg-muted/50 text-foreground font-bold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Customize
                </button>
              </div>

              <div className="mt-4 text-center">
                <Link 
                  href="/cookies" 
                  className="text-xs md:text-sm text-primary hover:underline"
                >
                  Cookie Policy
                </Link>
                <span className="text-muted-foreground mx-2">•</span>
                <Link 
                  href="/privacy" 
                  className="text-xs md:text-sm text-primary hover:underline"
                >
                  Privacy Policy
                </Link>
              </div>
            </div>
          ) : (
            // Cookie Settings Panel
            <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">
                  Cookie Preferences
                </h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                  aria-label="Close settings"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Manage your cookie preferences below. You can enable or disable different types of cookies.
              </p>

              <div className="space-y-4">
                {/* Necessary Cookies */}
                <div className="p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground mb-1">
                        Strictly Necessary Cookies
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        These cookies are essential for the website to function properly. 
                        They enable core functionality such as security, network management, 
                        and accessibility. These cookies cannot be disabled.
                      </p>
                    </div>
                    <div className="ml-4">
                      <div className="w-12 h-6 bg-primary rounded-full flex items-center px-1 cursor-not-allowed opacity-50">
                        <div className="w-4 h-4 bg-white rounded-full transform translate-x-6 transition-transform" />
                      </div>
                      <span className="text-xs text-muted-foreground mt-1 block text-center">
                        Always On
                      </span>
                    </div>
                  </div>
                </div>

                {/* Functional Cookies */}
                <div className="p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground mb-1">
                        Functional Cookies
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        These cookies enable enhanced functionality and personalization, 
                        such as remembering your preferences and settings.
                      </p>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => setPreferences({ ...preferences, functional: !preferences.functional })}
                        className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                          preferences.functional ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                        aria-label="Toggle functional cookies"
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                            preferences.functional ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground mb-1">
                        Analytics Cookies
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        These cookies help us understand how visitors interact with our website, 
                        helping us improve user experience and site performance.
                      </p>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => setPreferences({ ...preferences, analytics: !preferences.analytics })}
                        className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                          preferences.analytics ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                        aria-label="Toggle analytics cookies"
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                            preferences.analytics ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Marketing Cookies */}
                <div className="p-4 bg-muted/30 rounded-xl border border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-bold text-foreground mb-1">
                        Marketing Cookies
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        These cookies are used to track visitors across websites to display 
                        relevant advertisements and measure campaign effectiveness.
                      </p>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => setPreferences({ ...preferences, marketing: !preferences.marketing })}
                        className={`w-12 h-6 rounded-full flex items-center px-1 transition-colors ${
                          preferences.marketing ? "bg-primary" : "bg-muted-foreground/30"
                        }`}
                        aria-label="Toggle marketing cookies"
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transform transition-transform ${
                            preferences.marketing ? "translate-x-6" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-6">
                <button
                  onClick={saveCustom}
                  className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Save Preferences
                </button>
                <button
                  onClick={() => setShowSettings(false)}
                  className="flex-1 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-lg transition-all duration-300 transform hover:scale-105 active:scale-95"
                >
                  Cancel
                </button>
              </div>

              <div className="mt-4 text-center">
                <Link 
                  href="/cookies" 
                  className="text-xs md:text-sm text-primary hover:underline"
                >
                  Learn more about cookies
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}


