// src/components/home/HomeStats.tsx — Server Component
export function HomeStats() {
  const stats = [
    { value: '4 hr+', label: 'Average video saved' },
    { value: '10×',   label: 'Faster to key insights' },
    { value: 'Free',  label: 'To get started' },
  ]
  return (
    <div className="border-t border-b border-[var(--color-border-tertiary)] bg-[var(--color-bg-secondary)]">
      <div className="max-w-content mx-auto px-6 py-6 grid grid-cols-3 divide-x divide-[var(--color-border-tertiary)]">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center text-center px-4">
            <span className="text-display-md text-[var(--color-text-primary)]">{s.value}</span>
            <span className="text-body-sm text-[var(--color-text-secondary)] mt-1">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
