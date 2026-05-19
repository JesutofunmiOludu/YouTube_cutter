// src/components/home/HomeFeatures.tsx — Server Component
import { Scissors, FileText, Globe, MessageSquare, Download, Clock } from 'lucide-react'

const FEATURES = [
  { icon: Scissors,     title: 'AI video cutting',    description: 'AI suggests the best points to split long videos into chapters — approve in one click.', iconBg: 'bg-primary-50', iconColor: 'text-primary-600' },
  { icon: FileText,     title: 'Transcription',        description: 'Every word timestamped and searchable. Click any line to jump to that moment.',          iconBg: 'bg-success-50', iconColor: 'text-success-600' },
  { icon: Globe,        title: 'Deep research',        description: 'AI reads the web and returns a fully cited research report on the video\'s topic.',       iconBg: 'bg-premium-50', iconColor: 'text-premium-600' },
  { icon: MessageSquare,title: 'Chat with video',      description: 'Ask questions. Get answers grounded in the video. Compare multiple videos at once.',       iconBg: 'bg-warning-50', iconColor: 'text-warning-600' },
  { icon: Download,     title: 'Batch download',       description: 'Download all your cuts in one click. Premium users keep files on our servers.',           iconBg: 'bg-primary-50', iconColor: 'text-primary-600' },
  { icon: Clock,        title: 'Save hours',           description: 'Stop scrubbing through 4-hour tutorials. Let AI find the parts that matter.',             iconBg: 'bg-success-50', iconColor: 'text-success-600' },
]

export function HomeFeatures() {
  return (
    <section className="py-16 px-6 max-w-content mx-auto" aria-label="Features">
      <div className="text-center mb-10">
        <h2 className="text-heading-xl text-[var(--color-text-primary)] mb-3">Everything you need to learn faster</h2>
        <p className="text-body-lg text-[var(--color-text-secondary)] max-w-lg mx-auto">
          VidMind AI combines video processing, transcription, AI research, and chat — all in one place.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {FEATURES.map((feat) => {
          const Icon = feat.icon
          return (
            <div key={feat.title} className="bg-[var(--color-bg-primary)] border border-[var(--color-border-tertiary)] rounded-lg p-5 hover:border-[var(--color-border-secondary)] transition-colors duration-fast">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-4 ${feat.iconBg}`}>
                <Icon className={`w-4 h-4 ${feat.iconColor}`} aria-hidden="true" />
              </div>
              <h3 className="text-heading-sm text-[var(--color-text-primary)] mb-1.5">{feat.title}</h3>
              <p className="text-body-sm text-[var(--color-text-secondary)] leading-relaxed">{feat.description}</p>
            </div>
          )
        })}
      </div>
    </section>
  )
}
