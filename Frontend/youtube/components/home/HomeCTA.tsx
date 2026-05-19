// src/components/home/HomeCTA.tsx — Server Component
import Link from 'next/link'

export function HomeCTA() {
  return (
    <section className="py-16 px-6 bg-primary-600">
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-display-md text-white mb-4">Stop watching. Start understanding.</h2>
        <p className="text-body-lg text-primary-100 mb-8">
          Join thousands of students and researchers who use VidMind AI to learn smarter.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-lg text-body-md font-medium bg-white text-primary-800 hover:bg-primary-50 transition-colors"
        >
          Get started for free
        </Link>
        <p className="text-caption text-primary-200 mt-4">No credit card required</p>
      </div>
    </section>
  )
}
