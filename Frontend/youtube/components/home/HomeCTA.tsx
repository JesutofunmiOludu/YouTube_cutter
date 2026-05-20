// src/components/home/HomeCTA.tsx — Server Component
import Link from 'next/link'

export function HomeCTA() {
  return (
    <section className="py-16 px-6 bg-white">
      <div className="max-w-lg mx-auto text-center">
        <h2 className="text-display-md text-gray-900 mb-4">Stop watching. Start understanding.</h2>
        <p className="text-body-lg text-gray-600 mb-8">
          Join thousands of students and researchers who use VidMind AI to learn smarter.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 h-11 px-6 rounded-lg text-body-md font-medium bg-blue-600 text-white hover:bg-blue-800 transition-colors"
        >
          Get started for free
        </Link>
        <p className="text-caption text-gray-500 mt-4">No credit card required</p>
      </div>
    </section>
  )
}
