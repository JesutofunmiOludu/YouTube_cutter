# YouTube Cutter Home Page Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the YouTube cutter home page to match the visual design shown in `Images\Body (1).png` with a pure white background instead of the current background colors.

**Architecture:** Modify existing home page components (HomeHero, HomeStats, HomeFeatures, HomeHowItWorks, HomeCTA) and LandingLayout to use Tailwind utility classes directly in JSX to match the reference design while ensuring the background is pure white (#FFFFFF) consistently.

**Tech Stack:** Next.js, React, Tailwind CSS, Lucide Icons

---

### Task 1: Update LandingLayout for White Background

**Files:**
- Modify: `src/components/layout/LandingLayout.tsx:20-20`

- [ ] **Step 1: Identify current background class**
  
  Current code:
  ```tsx
  <div className="min-h-dvh flex flex-col bg-white">
  ```

- [ ] **Step 2: Verify current implementation already has white background**
  
  The LandingLayout already has `bg-white` class, which gives pure white background. No changes needed.

- [ ] **Step 3: Commit no changes (verified)**

```bash
git add src/components/layout/LandingLayout.tsx
git commit -m "chore: verify LandingLayout already has white background"
```

---

### Task 2: Update HomeHero Component Styling

**Files:**
- Modify: `src/components/home/HomeHero.tsx:32-82`

- [ ] **Step 1: Update section background and text colors**
  
  Change from:
  ```tsx
  <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-white" aria-label="Hero">
  ```
  
  To (no change needed for background, but ensuring proper text colors):
  ```tsx
  <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 bg-white" aria-label="Hero">
  ```

- [ ] **Step 2: Update badge styling to match reference**
  
  Change from:
  ```tsx
  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-50 border border-gray-200 text-caption font-medium text-gray-800 mb-6">
  ```
  
  To:
  ```tsx
  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-caption font-medium text-blue-800 mb-6">
  ```

- [ ] **Step 3: Update headline text colors**
  
  Change from:
  ```tsx
  <h1 className="text-display-lg text-gray-900 max-w-2xl mb-4 leading-tight">
    Stop watching.{' '}
    <span className="text-blue-600">Start understanding.</span>
  </h1>
  ```
  
  To:
  ```tsx
  <h1 className="text-display-lg text-gray-900 max-w-2xl mb-4 leading-tight">
    Stop watching.{' '}
    <span className="text-blue-600">Start understanding.</span>
  </h1>
  ```

- [ ] **Step 4: Update subtitle text color**
  
  Change from:
  ```tsx
  <p className="text-body-lg text-gray-600 max-w-lg mb-10 leading-relaxed">
    Paste any YouTube link or search a topic. AI slices it into chapters, transcribes it, and builds a cited research report — in seconds.
  </p>
  ```
  
  To:
  ```tsx
  <p className="text-body-lg text-gray-700 max-w-lg mb-10 leading-relaxed">
    Paste any YouTube link or search a topic. AI slices it into chapters, transcribes it, and builds a cited research report — in seconds.
  </p>
  ```

- [ ] **Step 5: Update form border colors**
  
  Change from:
  ```tsx
  <div className={cn(
    'flex items-center gap-2 bg-white border-2 rounded-xl px-4 py-3 transition-colors duration-base',
    isLink ? 'border-emerald-200' : 'border-gray-300',
    'focus-within:border-blue-400',
  )}>
  ```
  
  To:
  ```tsx
  <div className={cn(
    'flex items-center gap-2 bg-white border-2 rounded-xl px-4 py-3 transition-colors duration-base',
    isLink ? 'border-blue-500' : 'border-gray-300',
    'focus-within:border-blue-400',
  )}>
  ```

- [ ] **Step 6: Update input text color**
  
  Change from:
  ```tsx
  className="flex-1 bg-transparent border-none outline-none text-body-md text-gray-900 placeholder:text-gray-400"
  ```
  
  To:
  ```tsx
  className="flex-1 bg-transparent border-none outline-none text-body-md text-gray-900 placeholder:text-gray-500"
  ```

- [ ] **Step 7: Update button text for Process/Search**
  
  Change from:
  ```tsx
  {isLink ? 'Process' : 'Search'}
  ```
  
  To (no change needed - keeping as is):
  ```tsx
  {isLink ? 'Process' : 'Search'}
  ```

- [ ] **Step 8: Update helper text color**
  
  Change from:
  ```tsx
  <p className="text-caption text-gray-500 text-center mt-2">
    {isLink ? '✓ YouTube link detected — we\'ll process this video for you' : 'Try "learn React hooks" or paste any YouTube URL'}
  </p>
  ```
  
  To:
  ```tsx
  <p className="text-caption text-gray-600 text-center mt-2">
    {isLink ? '✓ YouTube link detected — we\'ll process this video for you' : 'Try "learn React hooks" or paste any YouTube URL'}
  </p>
  ```

- [ ] **Step 9: Update free plan link text**
  
  Change from:
  ```tsx
  <Link href="/register" className="text-blue-600 hover:text-blue-800 transition-colors">
    Free forever plan available
  </Link>
  ```
  
  To:
  ```tsx
  <Link href="/register" className="text-blue-600 hover:text-blue-800 transition-colors">
    Free forever plan available
  </Link>
  ```

- [ ] **Step 10: Commit changes**

```bash
git add src/components/home/HomeHero.tsx
git commit -m "feat: update HomeHero component styling to match reference design"
```

---

### Task 3: Update HomeStats Component Styling

**Files:**
- Modify: `src/components/home/HomeStats.tsx:9-19`

- [ ] **Step 1: Update section borders and background**
  
  Change from:
  ```tsx
  <div className="border-t border-b border-gray-200 bg-white">
  ```
  
  To:
  ```tsx
  <div className="border-t border-b border-gray-300 bg-white">
  ```

- [ ] **Step 2: Update grid divider color**
  
  Change from:
  ```tsx
  <div className="max-w-content mx-auto px-6 py-6 grid grid-cols-3 divide-x divide-gray-200">
  ```
  
  To:
  ```tsx
  <div className="max-w-content mx-auto px-6 py-6 grid grid-cols-3 divide-x divide-gray-300">
  ```

- [ ] **Step 3: Update value text color**
  
  Change from:
  ```tsx
  <span className="text-display-md text-gray-900">{s.value}</span>
  ```
  
  To:
  ```tsx
  <span className="text-display-md text-gray-900">{s.value}</span>
  ```

- [ ] **Step 4: Update label text color**
  
  Change from:
  ```tsx
  <span className="text-body-sm text-gray-600 mt-1">{s.label}</span>
  ```
  
  To:
  ```tsx
  <span className="text-body-sm text-gray-700 mt-1">{s.label}</span>
  ```

- [ ] **Step 5: Commit changes**

```bash
git add src/components/home/HomeStats.tsx
git commit -m "feat: update HomeStats component styling to match reference design"
```

---

### Task 4: Update HomeFeatures Component Styling

**Files:**
- Modify: `src/components/home/HomeFeatures.tsx:15-38`

- [ ] **Step 1: Update section background**
  
  Change from:
  ```tsx
  <section className="py-16 px-6 max-w-content mx-auto bg-white" aria-label="Features">
  ```
  
  To:
  ```tsx
  <section className="py-16 px-6 max-w-content mx-auto bg-white" aria-label="Features">
  ```

- [ ] **Step 2: Update heading text color**
  
  Change from:
  ```tsx
  <h2 className="text-heading-xl text-gray-900 mb-3">Everything you need to learn faster</h2>
  ```
  
  To:
  ```tsx
  <h2 className="text-heading-xl text-gray-900 mb-3">Everything you need to learn faster</h2>
  ```

- [ ] **Step 3: Update paragraph text color**
  
  Change from:
  ```tsx
  <p className="text-body-lg text-gray-600 max-w-lg mx-auto">
    VidMind AI combines video processing, transcription, AI research, and chat — all in one place.
  </p>
  ```
  
  To:
  ```tsx
  <p className="text-body-lg text-gray-700 max-w-lg mx-auto">
    VidMind AI combines video processing, transcription, AI research, and chat — all in one place.
  </p>
  ```

- [ ] **Step 4: Update feature card borders and hover effects**
  
  Change from:
  ```tsx
  <div key={feat.title} className="bg-white border border-gray-200 rounded-lg p-5 hover:border-gray-300 transition-colors duration-fast">
  ```
  
  To:
  ```tsx
  <div key={feat.title} className="bg-white border border-gray-300 rounded-lg p-5 hover:border-gray-400 transition-colors duration-fast">
  ```

- [ ] **Step 5: Update icon background colors (keeping existing as they match reference)**
  
  No changes needed to iconBg and iconColor as they already use appropriate colors.

- [ ] **Step 6: Commit changes**

```bash
git add src/components/home/HomeFeatures.tsx
git commit -m "feat: update HomeFeatures component styling to match reference design"
```

---

### Task 5: Update HomeHowItWorks Component Styling

**Files:**
- Modify: `src/components/home/HomeHowItWorks.tsx:9-24`

- [ ] **Step 1: Update section background (keeping default)**
  
  No background change needed as it inherits from parent.

- [ ] **Step 2: Update heading text color**
  
  Change from:
  ```tsx
  <h2 className="text-heading-xl text-gray-900 text-center mb-10">How it works</h2>
  ```
  
  To:
  ```tsx
  <h2 className="text-heading-xl text-gray-900 text-center mb-10">How it works</h2>
  ```

- [ ] **Step 3: Update step indicator background and border**
  
  Change from:
  ```tsx
  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-blue-50 border-2 border-blue-200 text-heading-lg text-blue-800 font-medium">
  ```
  
  To:
  ```tsx
  <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-blue-50 border-2 border-blue-200 text-heading-lg text-blue-800 font-medium">
  ```

- [ ] **Step 4: Update step title text color**
  
  Change from:
  ```tsx
  <h3 className="text-heading-sm text-gray-900 mb-2">{step.title}</h3>
  ```
  
  To:
  ```tsx
  <h3 className="text-heading-sm text-gray-900 mb-2">{step.title}</h3>
  ```

- [ ] **Step 5: Update step description text color**
  
  Change from:
  ```tsx
  <p className="text-body-sm text-gray-600 leading-relaxed">{step.description}</p>
  ```
  
  To:
  ```tsx
  <p className="text-body-sm text-gray-700 leading-relaxed">{step.description}</p>
  ```

- [ ] **Step 6: Commit changes**

```bash
git add src/components/home/HomeHowItWorks.tsx
git commit -m "feat: update HomeHowItWorks component styling to match reference design"
```

---

### Task 6: Update HomeCTA Component Styling

**Files:**
- Modify: `src/components/home/HomeCTA.tsx:6-22`

- [ ] **Step 1: Update section background**
  
  Change from:
  ```tsx
  <section className="py-16 px-6 bg-white">
  ```
  
  To:
  ```tsx
  <section className="py-16 px-6 bg-white">
  ```

- [ ] **Step 2: Update heading text color**
  
  Change from:
  ```tsx
  <h2 className="text-display-md text-gray-900 mb-4">Stop watching. Start understanding.</h2>
  ```
  
  To:
  ```tsx
  <h2 className="text-display-md text-gray-900 mb-4">Stop watching. Start understanding.</h2>
  ```

- [ ] **Step 3: Update paragraph text color**
  
  Change from:
  ```tsx
  <p className="text-body-lg text-gray-600 mb-8">
    Join thousands of students and researchers who use VidMind AI to learn smarter.
  </p>
  ```
  
  To:
  ```tsx
  <p className="text-body-lg text-gray-700 mb-8">
    Join thousands of students and researchers who use VidMind AI to learn smarter.
  </p>
  ```

- [ ] **Step 4: Update button background and text colors**
  
  Change from:
  ```tsx
  <Link
    href="/register"
    className="inline-flex items-center gap-2 h-11 px-6 rounded-lg text-body-md font-medium bg-blue-600 text-white hover:bg-blue-800 transition-colors"
  >
    Get started for free
  </Link>
  ```
  
  To:
  ```tsx
  <Link
    href="/register"
    className="inline-flex items-center gap-2 h-11 px-6 rounded-lg text-body-md font-medium bg-blue-600 text-white hover:bg-blue-800 transition-colors"
  >
    Get started for free
  </Link>
  ```

- [ ] **Step 5: Update helper text color**
  
  Change from:
  ```tsx
  <p className="text-caption text-gray-500 mt-4">No credit card required</p>
  ```
  
  To:
  ```tsx
  <p className="text-caption text-gray-600 mt-4">No credit card required</p>
  ```

- [ ] **Step 6: Commit changes**

```bash
git add src/components/home/HomeCTA.tsx
git commit -m "feat: update HomeCTA component styling to match reference design"
```

---

### Task 7: Update HomeNav Component Styling (if needed)

**Files:**
- Modify: `src/components/home/HomeNav.tsx`

- [ ] **Step 1: Examine current HomeNav styling**
  
  [Examine file to determine if nav colors need adjustment for white background]

- [ ] **Step 2: Update nav colors if needed**
  
  [Make necessary changes to ensure nav is visible on white background]

- [ ] **Step 3: Commit changes**

```bash
git add src/components/home/HomeNav.tsx
git commit -m "feat: update HomeNav component styling for white background"
```

---

### Task 8: Update HomeFooter Component Styling (if needed)

**Files:**
- Modify: `src/components/home/HomeFooter.tsx`

- [ ] **Step 1: Examine current HomeFooter styling**
  
  [Examine file to determine if footer colors need adjustment for white background]

- [ ] **Step 2: Update footer colors if needed**
  
  [Make necessary changes to ensure footer is visible on white background]

- [ ] **Step 3: Commit changes**

```bash
git add src/components/home/HomeFooter.tsx
git commit -m "feat: update HomeFooter component styling for white background"
```

---

### Task 9: Verify Implementation and Test Responsiveness

**Files:**
- Test: Manual verification

- [ ] **Step 1: Start development server**
  
  Run: `npm run dev`

- [ ] **Step 2: Visit home page and verify white background**
  
  Confirm background is pure white (#FFFFFF)

- [ ] **Step 3: Compare with reference image**
  
  Visually inspect layout matches `Images\Body (1).png`

- [ ] **Step 4: Test responsiveness**
  
  Check layout on different screen sizes (mobile, tablet, desktop)

- [ ] **Step 5: Test light/dark mode**
  
  Verify white background persists in both modes

- [ ] **Step 6: Test functionality**
  
  Ensure form submission, navigation, and links still work correctly

- [ ] **Step 7: Commit final verification**

```bash
git add .
git commit -m "chore: verify home page redesign implementation matches reference design"
```