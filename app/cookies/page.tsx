export default function CookiesPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 tracking-wide">COOKIES POLICY</h1>

        <div className="space-y-8 font-mono text-sm md:text-base leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">1. WHAT ARE COOKIES?</h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. They help us recognize you
              and enhance your experience.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">2. TYPES OF COOKIES WE USE</h2>
            <div className="space-y-3">
              <div>
                <p className="font-bold text-foreground">Essential Cookies</p>
                <p>Necessary for basic website functionality and security.</p>
              </div>
              <div>
                <p className="font-bold text-foreground">Analytics Cookies</p>
                <p>Help us understand how visitors interact with our site using tools like Vercel Analytics.</p>
              </div>
              <div>
                <p className="font-bold text-foreground">Preference Cookies</p>
                <p>Remember your preferences and settings for a personalized experience.</p>
              </div>
              <div>
                <p className="font-bold text-foreground">Marketing Cookies</p>
                <p>Track your activity to deliver relevant content and advertisements.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">3. THIRD-PARTY COOKIES</h2>
            <p>
              We may use third-party services that set cookies, including Spotify for music integration and Vercel for
              analytics. These services have their own cookie policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">4. MANAGING COOKIES</h2>
            <p>You can control cookies through your browser settings:</p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>Block all cookies</li>
              <li>Allow only certain cookies</li>
              <li>Delete existing cookies</li>
              <li>Receive warnings before cookies are stored</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">5. COOKIE RETENTION</h2>
            <p>
              Cookies are retained for varying periods depending on their type. Essential cookies remain active
              throughout your session, while analytics cookies may be retained longer for trend analysis.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">6. QUESTIONS?</h2>
            <p>For questions about our cookie usage, contact us at: info@jonspirit.com</p>
          </section>

          <section className="pt-4 border-t border-border">
            <p className="text-xs">Last updated: December 2024</p>
          </section>
        </div>
      </div>
    </div>
  )
}
