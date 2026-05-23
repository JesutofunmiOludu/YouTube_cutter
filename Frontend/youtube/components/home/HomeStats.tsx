// src/components/home/HomeStats.tsx — Server Component
export function HomeStats() {
  const stats = [
    { value: '4 hr+', label: 'Average video saved' },
    { value: '10×',   label: 'Faster to key insights' },
    { value: 'Free',  label: 'To get started' },
  ]
  return (
    <div className="border-t border-b border-gray-300 bg-white">
      <div className="max-w-content mx-auto px-6 py-6 grid grid-cols-3 divide-x divide-gray-300">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center text-center px-4">
            <span className="text-display-md text-gray-900">{s.value}</span>
            <span className="text-body-sm text-gray-700 mt-1">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
