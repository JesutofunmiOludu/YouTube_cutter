// src/components/home/HomeFooter.tsx — Server Component
import Link from 'next/link'

function LogoMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 32 32" fill="none" aria-hidden="true">
      <rect x="1" y="1" width="30" height="22" rx="5" fill="#E6F1FB" stroke="#378ADD" strokeWidth="1.5"/>
      <path d="M12 29h8M16 23v6" stroke="#378ADD" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 9l9 4.5-9 4.5V9z" fill="#378ADD"/>
    </svg>
  )
}

const RESOURCES = ['Twitter', 'LinkedIn', 'Status']
const LEGAL = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
]

export function HomeFooter() {
  return (
    <footer className="border-t bg-white border-gray-200">
      <div className="max-w-content mx-auto px-6 py-14">

        {/* Top row: brand + columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12">

          {/* Brand */}
          <div className="sm:col-span-1">
            <div className="flex items-center gap-2 text-gray-900 font-medium mb-4" style={{ fontSize: '14px' }}>
              <LogoMark />
              VidMind AI
            </div>
            <p className="text-gray-600" style={{ fontSize: '13px', lineHeight: '1.6' }}>
              Intelligence for the visual era. We help you extract wisdom from pixels.
            </p>
          </div>

          {/* Resources */}
          <div>
            <h4
              className="text-gray-900 font-medium mb-5"
              style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }}
            >
              Resources
            </h4>
            <ul className="flex flex-col gap-3">
              {RESOURCES.map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                    style={{ fontSize: '13px' }}
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4
              className="text-gray-900 font-medium mb-5"
              style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }}
            >
              Legal
            </h4>
            <ul className="flex flex-col gap-3">
              {LEGAL.map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-gray-600 hover:text-gray-900 transition-colors"
                    style={{ fontSize: '13px' }}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 flex items-center justify-between border-t border-gray-200">
          <p
            className="text-gray-500"
            style={{ fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase' }}
          >
            © 2024 VIDMIND AI. PRECISION IN MOTION.
          </p>

          {/* Icon buttons */}
          <div className="flex items-center gap-2">
            {/* Globe / language */}
            <button
              aria-label="Change language"
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors bg-gray-50 border border-gray-200 hover:bg-gray-100"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="10"/>
                <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
              </svg>
            </button>

            {/* Sun / theme */}
            <button
              aria-label="Toggle theme"
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors bg-gray-50 border border-gray-200 hover:bg-gray-100"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <circle cx="12" cy="12" r="5"/>
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            </button>
          </div>
        </div>

      </div>
    </footer>
  )
}
