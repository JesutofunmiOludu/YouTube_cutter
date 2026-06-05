// src/components/home/HomeCTA.tsx — Server Component
import Link from 'next/link'

export function HomeCTA() {
  return (
    <section
      className="py-24 px-6 bg-white"
      aria-label="Call to action"
    >
      <div className="max-w-content mx-auto">
        {/* Rounded dark-blue card */}
        <div
          className="text-center px-10 py-20 rounded-2xl"
          style={{
            backgroundColor: '#0c1829',
            border: '1px solid rgba(37, 99, 235, 0.25)',
          }}
        >
          <h2
            className="text-white font-medium mb-5"
            style={{ fontSize: '36px', lineHeight: '1.2', letterSpacing: '-0.02em' }}
          >
            Ready to upgrade your<br />learning?
          </h2>

          <p
            className="text-gray-400 max-w-md mx-auto mb-12"
            style={{ fontSize: '16px', lineHeight: '1.7' }}
          >
            Join 20,000+ creators, researchers, and students using VidMind
            to master complex topics faster than ever.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            {/* Primary */}
            <Link
              href="/register"
              id="cta-get-started"
              className="inline-flex items-center h-12 px-8 rounded-lg text-white font-medium transition-colors"
              style={{ backgroundColor: '#2563eb', fontSize: '15px' }}
            >
              Get Started Free
            </Link>

            {/* Secondary */}
            <Link
              href="/demo"
              id="cta-schedule-demo"
              className="inline-flex items-center h-12 px-8 rounded-lg text-white font-medium transition-colors"
              style={{
                backgroundColor: 'transparent',
                border: '1.5px solid #333',
                fontSize: '15px',
              }}
            >
              Schedule Demo
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
