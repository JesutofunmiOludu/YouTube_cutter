// src/components/home/HomeHowItWorks.tsx — Server Component
export function HomeHowItWorks() {
  const steps = [
    { step: '1', title: 'Paste a link or search',  description: 'Drop any YouTube URL or type a topic to find relevant videos instantly.' },
    { step: '2', title: 'AI processes the video',  description: 'We transcribe, analyse, and suggest the best cut points automatically.' },
    { step: '3', title: 'Learn at your own pace',  description: 'Watch by chapter, chat with the video, or run a full deep research report.' },
  ]
  return (
    <section className="py-16 px-6 max-w-content mx-auto" aria-label="How it works">
      <h2 className="text-heading-xl text-gray-900 text-center mb-10">How it works</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {steps.map((step) => (
          <div key={step.step} className="flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-blue-50 border-2 border-blue-200 text-heading-lg text-blue-800 font-medium">
              {step.step}
            </div>
            <h3 className="text-heading-sm text-gray-900 mb-2">{step.title}</h3>
            <p className="text-body-sm text-gray-700 leading-relaxed">{step.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
