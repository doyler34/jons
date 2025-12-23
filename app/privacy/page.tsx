"use client"

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 tracking-wide">PRIVACY POLICY</h1>

        <div className="space-y-8 font-mono text-sm md:text-base leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">1. INTRODUCTION</h2>
            <p>
              This Privacy Policy explains how Jon Spirit ("we," "us," "our," or "Company") collects, uses, discloses,
              and otherwise handles your personal information when you visit our website and use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">2. INFORMATION WE COLLECT</h2>
            <p>We may collect information about you in a variety of ways, including:</p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>Information you voluntarily provide (name, email, messages)</li>
              <li>Automatically collected information (IP address, browser type, pages visited)</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Information from third-party services (Spotify integration)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">3. HOW WE USE YOUR INFORMATION</h2>
            <p>We use collected information for:</p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>Providing and improving our services</li>
              <li>Sending promotional emails and updates</li>
              <li>Analyzing website usage and trends</li>
              <li>Personalizing your experience</li>
              <li>Detecting and preventing fraudulent transactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">4. DATA SECURITY</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information
              against unauthorized access, alteration, disclosure, or destruction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">5. THIRD-PARTY LINKS</h2>
            <p>
              Our site may contain links to third-party websites. We are not responsible for the privacy practices of
              other sites. We encourage you to review their privacy policies.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">6. YOUR RIGHTS</h2>
            <p>
              You have the right to access, update, or delete your personal information. Contact us using the
              information below to exercise these rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">7. CONTACT US</h2>
            <p>If you have questions about this Privacy Policy, please contact us at: info@jonspirit.com</p>
          </section>

          <section className="pt-4 border-t border-border">
            <p className="text-xs">Last updated: December 2024</p>
          </section>
        </div>
      </div>
    </div>
  )
}
