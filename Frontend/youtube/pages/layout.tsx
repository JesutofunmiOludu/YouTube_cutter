// ============================================================
// VidMind AI — Root Layout
// src/app/layout.tsx
//
// This is the outermost layout — wraps every page.
// Sets up fonts, metadata, global CSS, and providers.
// This is a Server Component (no 'use client').
// ============================================================

import type { Metadata, Viewport } from 'next'
import { DM_Sans, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Providers }               from '@/components/providers/Providers'

// ── Google Fonts (Next.js optimised) ──────────────────────

const dmSans = DM_Sans({
  subsets:  ['latin'],
  variable: '--font-dm-sans',
  weight:   ['300', '400', '500'],
  display:  'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets:  ['latin'],
  variable: '--font-jetbrains-mono',
  weight:   ['400', '500'],
  display:  'swap',
})

// ── SEO Metadata ──────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default:  'VidMind AI — Smart Video Learning & Research',
    template: '%s | VidMind AI',
  },
  description:
    'Paste any YouTube link. AI splits it into chapters, transcribes it, and builds a cited research report — in seconds.',
  keywords: [
    'YouTube learning', 'AI video summarizer', 'video transcription',
    'deep research AI', 'video chapters', 'study tool',
  ],
  authors:      [{ name: 'VidMind AI' }],
  creator:      'VidMind AI',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://vidmindai.com'),
  openGraph: {
    type:        'website',
    locale:      'en_US',
    url:         '/',
    siteName:    'VidMind AI',
    title:       'VidMind AI — Smart Video Learning & Research',
    description: 'Stop watching. Start understanding. AI-powered video learning platform.',
  },
  twitter: {
    card:    'summary_large_image',
    creator: '@vidmindai',
    title:   'VidMind AI',
    description: 'Stop watching. Start understanding.',
  },
  robots: {
    index:  true,
    follow: true,
  },
}

export const viewport: Viewport = {
  width:        'device-width',
  initialScale: 1,
  themeColor:   [
    { media: '(prefers-color-scheme: light)', color: '#F1EFE8' },
    { media: '(prefers-color-scheme: dark)',  color: '#141412' },
  ],
}

// ── Root Layout ───────────────────────────────────────────

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}