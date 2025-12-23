"use client"

export default function TermsOfUse() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-4xl mx-auto px-4 py-16 md:py-24">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 tracking-wide">TERMS OF USE</h1>

        <div className="space-y-8 font-mono text-sm md:text-base leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">1. AGREEMENT TO TERMS</h2>
            <p>
              By accessing and using this website, you accept and agree to be bound by the terms and provision of this
              agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">2. USE LICENSE</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on the
              Jon Spirit website for personal, non-commercial transitory viewing only. This is the grant of a license,
              not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-2">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on the website</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">3. DISCLAIMER</h2>
            <p>
              The materials on Jon Spirit's website are provided on an 'as is' basis. Jon Spirit makes no warranties,
              expressed or implied, and hereby disclaims and negates all other warranties including, without limitation,
              implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement
              of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">4. LIMITATIONS</h2>
            <p>
              In no event shall Jon Spirit or its suppliers be liable for any damages (including, without limitation,
              damages for loss of data or profit, or due to business interruption) arising out of the use or inability
              to use the materials on the Jon Spirit website.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">5. ACCURACY OF MATERIALS</h2>
            <p>
              The materials appearing on the Jon Spirit website could include technical, typographical, or photographic
              errors. Jon Spirit does not warrant that any of the materials on the website are accurate, complete, or
              current.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">6. MODIFICATIONS</h2>
            <p>
              Jon Spirit may revise these terms of use for the website at any time without notice. By using this
              website, you are agreeing to be bound by the then current version of these terms of use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">7. GOVERNING LAW</h2>
            <p>
              These terms and conditions are governed by and construed in accordance with the laws of the United States,
              and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-foreground mb-4">8. CONTACT</h2>
            <p>If you have any questions about these Terms of Use, please contact us at: info@jonspirit.com</p>
          </section>

          <section className="pt-4 border-t border-border">
            <p className="text-xs">Last updated: December 2024</p>
          </section>
        </div>
      </div>
    </div>
  )
}
