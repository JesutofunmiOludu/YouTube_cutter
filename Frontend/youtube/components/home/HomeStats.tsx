// src/components/home/HomeStats.tsx — Server Component
import { Clock, Zap, CheckCircle } from 'lucide-react'

const STATS = [
  { icon: Clock,       value: '4hr+', label: 'VIDEO INDEXED'  },
  { icon: Zap,         value: '10x',  label: 'LEARNING SPEED' },
  { icon: CheckCircle, value: 'Free', label: 'TO GET STARTED' },
]

export function HomeStats() {
  return (
    <div className="py-16 px-6 bg-white">
      <div className="max-w-2xl mx-auto grid grid-cols-3 gap-4">
        {STATS.map((s) => {
          const Icon = s.icon
          return (
            <div
              key={s.label}
              className="flex flex-col items-center text-center gap-3 px-4 py-8 rounded-xl"
              style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}
            >
              {/* Icon ring */}
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe' }}
              >
                <Icon className="w-5 h-5" style={{ color: '#3b82f6' }} aria-hidden="true" />
              </div>

              {/* Value */}
              <span
                className="text-gray-900 font-medium"
                style={{ fontSize: '28px', lineHeight: '1.2', letterSpacing: '-0.015em' }}
              >
                {s.value}
              </span>

              {/* Label */}
              <span
                className="text-gray-500"
                style={{ fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase' }}
              >
                {s.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
