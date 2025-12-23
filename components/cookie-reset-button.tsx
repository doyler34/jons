"use client"

import { RotateCcw } from "lucide-react"
import { useState } from "react"

export default function CookieResetButton() {
  const [showConfirm, setShowConfirm] = useState(false)
  const [reset, setReset] = useState(false)

  const handleReset = () => {
    localStorage.removeItem("cookie-consent")
    localStorage.removeItem("cookie-consent-date")
    setReset(true)
    setShowConfirm(false)
    
    // Show success message for 2 seconds then reload
    setTimeout(() => {
      window.location.reload()
    }, 2000)
  }

  if (reset) {
    return (
      <div className="fixed bottom-4 right-4 z-[10000] bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-bottom">
        <p className="text-sm font-semibold">Cookies reset! Reloading...</p>
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="fixed bottom-4 right-4 z-[10000] p-3 bg-muted/80 hover:bg-muted text-foreground rounded-full shadow-lg backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
        title="Reset Cookie Preferences"
      >
        <RotateCcw className="w-5 h-5" />
      </button>

      {showConfirm && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
            onClick={() => setShowConfirm(false)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[10000] bg-card border-2 border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-foreground mb-2">Reset Cookie Preferences?</h3>
            <p className="text-sm text-muted-foreground mb-6">
              This will clear your cookie preferences and reload the page. The cookie banner will appear again.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-all"
              >
                Reset
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-lg transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </>
      )}
    </>
  )
}


