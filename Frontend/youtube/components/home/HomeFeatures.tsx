// src/components/home/HomeFeatures.tsx — Server Component
import { Sparkles, Network, FileText, Globe, MessageSquare, BarChart2 } from 'lucide-react'

const FEATURES = [
  {
    icon:        Sparkles,
    title:       'Instant Summaries',
    description: 'Get the gist of any 2-hour lecture in under 60 seconds with our semantic compression AI.',
  },
  {
    icon:        Network,
    title:       'Topic Mapping',
    description: 'Visually explore connections between different video segments and themes automatically.',
  },
  {
    icon:        FileText,
    title:       'Transcription',
    description: 'Every word timestamped and searchable. Making the transcriptions readable. Export as PDF or Markdown.',
  },
  {
    icon:        Globe,
    title:       'Deep research',
    description: 'AI reads the web and returns a cited research report on the video topic.',
  },
  {
    icon:        MessageSquare,
    title:       'Chat with video',
    description: 'Share video knowledge graphs with your team to build a shared intelligence library.',
  },
  {
    icon:        BarChart2,
    title:       'Multi-video compare',
    description: 'Add multiple videos to one chat and compare their insights side by side.',
  },
]

export function HomeFeatures() {
  return (
    <section
      className="py-24 px-6 bg-white"
      aria-label="Features"
    >
      <div className="max-w-content mx-auto">

        {/* Section heading with blue accent bar */}
        <div className="mb-14 text-center sm:text-left">
          <h2
            className="text-gray-900 font-medium relative inline-block"
            style={{ fontSize: '22px', lineHeight: '1.3', letterSpacing: '-0.01em' }}
          >
            Powering better workflows
            <span
              className="absolute -bottom-2 left-0 rounded-full"
              style={{ width: '48px', height: '2px', backgroundColor: '#2563eb' }}
            />
          </h2>
        </div>

        {/* 3-column feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((feat) => {
            const Icon = feat.icon
            return (
              <div
                key={feat.title}
                className="rounded-xl p-6 transition-all duration-200 group cursor-default"
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.borderColor = '#d1d5db'
                  e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)'
                }}
                onMouseLeave={(e: React.MouseEvent<HTMLDivElement>) => {
                  e.currentTarget.style.borderColor = '#e5e7eb'
                  e.currentTarget.style.boxShadow = 'none'
                }}
              >
                {/* Icon box */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-5"
                  style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}
                >
                  <Icon className="w-4 h-4" style={{ color: '#3b82f6' }} aria-hidden="true" />
                </div>

                <h3
                  className="text-gray-900 font-medium mb-2"
                  style={{ fontSize: '14px', lineHeight: '1.4' }}
                >
                  {feat.title}
                </h3>

                <p
                  className="text-gray-600"
                  style={{ fontSize: '13px', lineHeight: '1.6' }}
                >
                  {feat.description}
                </p>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
