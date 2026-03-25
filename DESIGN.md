# Design System & UI/UX Guidelines

> A comprehensive guide to the visual design, user experience, and interface patterns for the Video Learning & Creation Platform

## 📖 Table of Contents

- [Design Philosophy](#design-philosophy)
- [Brand Identity](#brand-identity)
- [Color System](#color-system)
- [Typography](#typography)
- [Spacing & Layout](#spacing--layout)
- [Components](#components)
- [User Flows](#user-flows)
- [Page Designs](#page-designs)
- [Responsive Design](#responsive-design)
- [Accessibility](#accessibility)
- [Animation & Motion](#animation--motion)
- [Dark Mode](#dark-mode)
- [Design Tokens](#design-tokens)
- [Figma Resources](#figma-resources)

---

## 🎨 Design Philosophy

### Core Principles

#### 1. **Simplicity First**
- Clean, uncluttered interfaces
- Clear visual hierarchy
- Progressive disclosure of complexity
- Focus user attention on primary actions

#### 2. **Instant Understanding**
- Self-explanatory interfaces
- Minimal learning curve
- Visual feedback for all actions
- Clear error messages and guidance

#### 3. **Speed & Efficiency**
- Fast page loads
- Minimal clicks to accomplish tasks
- Keyboard shortcuts for power users
- Batch operations where possible

#### 4. **Delightful Experience**
- Smooth animations
- Thoughtful micro-interactions
- Celebrate user accomplishments
- Personality without distraction

#### 5. **Accessibility for All**
- WCAG 2.1 AA compliant
- Keyboard navigation
- Screen reader friendly
- High contrast modes

### Design Goals

**For Students:**
- Make learning feel effortless
- Reduce cognitive load
- Create sense of progress
- Build confidence

**For Creators:**
- Empower creativity
- Remove technical barriers
- Inspire experimentation
- Professional results quickly

**For Everyone:**
- Trustworthy and reliable
- Fast and responsive
- Beautiful and modern
- Consistent and predictable

---

## 🎯 Brand Identity

### Brand Personality

- **Smart** but not intimidating
- **Helpful** but not patronizing  
- **Modern** but not trendy
- **Professional** but approachable
- **Innovative** but reliable

### Voice & Tone

**Voice (consistent):**
- Clear and direct
- Friendly and supportive
- Knowledgeable and confident
- Conversational not corporate

**Tone (context-dependent):**
- **Onboarding:** Encouraging, educational
- **Errors:** Empathetic, solution-focused
- **Success:** Celebratory, motivating
- **Marketing:** Inspirational, benefit-focused

### Logo Concept

**Primary Logo:**
```
┌─────────────────────────────────┐
│                                 │
│    [V]  VideoLearn              │
│    ━━   AI-Powered Learning     │
│                                 │
└─────────────────────────────────┘
```

**Logo Guidelines:**
- Minimum size: 32px height
- Clear space: Equal to height of "V"
- Primary: Full color
- Secondary: White on brand color
- Tertiary: Monochrome for documents

**Icon/Favicon:**
- Simplified "V" mark
- Works at 16x16px
- Distinctive in browser tabs

---

## 🎨 Color System

### Primary Colors

#### Brand Blue (Primary)
```
Blue 50:  #EFF6FF  - Lightest backgrounds
Blue 100: #DBEAFE  - Hover states
Blue 200: #BFDBFE  - Disabled states
Blue 300: #93C5FD  - Borders
Blue 400: #60A5FA  - Secondary actions
Blue 500: #3B82F6  - Primary brand color ⭐
Blue 600: #2563EB  - Primary hover
Blue 700: #1D4ED8  - Primary active
Blue 800: #1E40AF  - Text on light bg
Blue 900: #1E3A8A  - Darkest blue
```

**Usage:**
- Primary CTAs (buttons, links)
- Progress indicators
- Active states
- Focus rings
- Brand moments

#### Neutral Gray (Foundation)
```
Gray 50:  #F9FAFB  - Page backgrounds
Gray 100: #F3F4F6  - Card backgrounds
Gray 200: #E5E7EB  - Borders
Gray 300: #D1D5DB  - Disabled text
Gray 400: #9CA3AF  - Placeholder text
Gray 500: #6B7280  - Secondary text
Gray 600: #4B5563  - Body text
Gray 700: #374151  - Headings
Gray 800: #1F2937  - Dark headings
Gray 900: #111827  - Maximum contrast
```

**Usage:**
- Text hierarchy
- Backgrounds
- Borders and dividers
- Shadows
- Neutral UI elements

### Semantic Colors

#### Success (Green)
```
Green 50:  #F0FDF4
Green 100: #DCFCE7
Green 500: #22C55E  - Success primary ⭐
Green 600: #16A34A  - Success dark
Green 700: #15803D
```

**Usage:**
- Success messages
- Completed states
- Positive actions
- Growth indicators

#### Warning (Amber)
```
Amber 50:  #FFFBEB
Amber 100: #FEF3C7
Amber 500: #F59E0B  - Warning primary ⭐
Amber 600: #D97706  - Warning dark
Amber 700: #B45309
```

**Usage:**
- Warning messages
- Caution states
- Important notices
- Usage limits

#### Error (Red)
```
Red 50:  #FEF2F2
Red 100: #FEE2E2
Red 500: #EF4444  - Error primary ⭐
Red 600: #DC2626  - Error dark
Red 700: #B91C1C
```

**Usage:**
- Error messages
- Destructive actions
- Failed states
- Critical alerts

#### Info (Sky Blue)
```
Sky 50:  #F0F9FF
Sky 100: #E0F2FE
Sky 500: #0EA5E9  - Info primary ⭐
Sky 600: #0284C7  - Info dark
Sky 700: #0369A1
```

**Usage:**
- Informational messages
- Tips and hints
- Neutral notifications
- Helper text

### Gradient Colors

#### Primary Gradient
```css
background: linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%);
```

**Usage:**
- Hero sections
- Premium features highlight
- Success celebrations
- Special promotions

#### Subtle Gradient
```css
background: linear-gradient(180deg, #FFFFFF 0%, #F9FAFB 100%);
```

**Usage:**
- Card backgrounds
- Section transitions
- Depth creation
- Soft shadows

### Color Usage Guidelines

**Do's:**
- Use primary blue for main CTAs
- Use semantic colors for feedback
- Maintain 4.5:1 contrast for text
- Use neutral grays for most UI
- Reserve vibrant colors for important actions

**Don'ts:**
- Don't use red for regular buttons
- Don't mix multiple bright colors
- Don't use low contrast combinations
- Don't overuse gradients
- Don't use color alone to convey information

---

## 📝 Typography

### Font Families

#### Primary Font: Inter
```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Usage:** Body text, UI elements, most content

**Why Inter:**
- Excellent readability on screens
- Complete character set
- Open source
- Variable font support
- Optimized for UI

#### Secondary Font: JetBrains Mono
```css
font-family: 'JetBrains Mono', 'Courier New', monospace;
```

**Usage:** Code blocks, technical content, timestamps

**Why JetBrains Mono:**
- Designed for developers
- Clear character distinction
- Excellent readability
- Ligature support

### Type Scale

```css
/* Headings */
--text-xs:   0.75rem;   /* 12px */
--text-sm:   0.875rem;  /* 14px */
--text-base: 1rem;      /* 16px */
--text-lg:   1.125rem;  /* 18px */
--text-xl:   1.25rem;   /* 20px */
--text-2xl:  1.5rem;    /* 24px */
--text-3xl:  1.875rem;  /* 30px */
--text-4xl:  2.25rem;   /* 36px */
--text-5xl:  3rem;      /* 48px */
--text-6xl:  3.75rem;   /* 60px */
```

### Font Weights

```css
--font-light:     300;
--font-regular:   400;
--font-medium:    500;
--font-semibold:  600;
--font-bold:      700;
--font-extrabold: 800;
```

### Line Heights

```css
--leading-none:    1;
--leading-tight:   1.25;
--leading-snug:    1.375;
--leading-normal:  1.5;
--leading-relaxed: 1.625;
--leading-loose:   2;
```

### Typography Styles

#### Headings

**H1 - Page Title**
```css
font-size: 3rem;        /* 48px */
font-weight: 800;       /* Extra bold */
line-height: 1.2;
letter-spacing: -0.02em;
color: var(--gray-900);
```

**H2 - Section Title**
```css
font-size: 2.25rem;     /* 36px */
font-weight: 700;       /* Bold */
line-height: 1.25;
letter-spacing: -0.01em;
color: var(--gray-900);
```

**H3 - Subsection Title**
```css
font-size: 1.875rem;    /* 30px */
font-weight: 600;       /* Semibold */
line-height: 1.3;
color: var(--gray-800);
```

**H4 - Component Title**
```css
font-size: 1.5rem;      /* 24px */
font-weight: 600;       /* Semibold */
line-height: 1.4;
color: var(--gray-800);
```

**H5 - Small Title**
```css
font-size: 1.25rem;     /* 20px */
font-weight: 600;       /* Semibold */
line-height: 1.5;
color: var(--gray-700);
```

**H6 - Tiny Title**
```css
font-size: 1rem;        /* 16px */
font-weight: 600;       /* Semibold */
line-height: 1.5;
color: var(--gray-700);
text-transform: uppercase;
letter-spacing: 0.05em;
```

#### Body Text

**Body Large**
```css
font-size: 1.125rem;    /* 18px */
font-weight: 400;       /* Regular */
line-height: 1.75;
color: var(--gray-600);
```

**Body Regular**
```css
font-size: 1rem;        /* 16px */
font-weight: 400;       /* Regular */
line-height: 1.5;
color: var(--gray-600);
```

**Body Small**
```css
font-size: 0.875rem;    /* 14px */
font-weight: 400;       /* Regular */
line-height: 1.5;
color: var(--gray-500);
```

**Caption**
```css
font-size: 0.75rem;     /* 12px */
font-weight: 400;       /* Regular */
line-height: 1.5;
color: var(--gray-400);
```

#### Interactive Text

**Link**
```css
font-weight: 500;       /* Medium */
color: var(--blue-600);
text-decoration: underline;
text-decoration-thickness: 1px;
text-underline-offset: 2px;

/* Hover state */
&:hover {
  color: var(--blue-700);
  text-decoration-thickness: 2px;
}
```

**Button Text**
```css
font-size: 1rem;        /* 16px */
font-weight: 600;       /* Semibold */
letter-spacing: 0.01em;
```

---

## 📐 Spacing & Layout

### Spacing Scale

Based on 4px base unit:

```css
--space-0:  0;
--space-1:  0.25rem;   /* 4px */
--space-2:  0.5rem;    /* 8px */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-5:  1.25rem;   /* 20px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
--space-24: 6rem;      /* 96px */
--space-32: 8rem;      /* 128px */
```

### Layout Containers

**Page Container**
```css
max-width: 1280px;     /* Desktop */
margin: 0 auto;
padding: 0 2rem;       /* 32px */

@media (max-width: 768px) {
  padding: 0 1rem;     /* 16px mobile */
}
```

**Content Container**
```css
max-width: 768px;      /* Optimal reading width */
margin: 0 auto;
```

**Wide Container**
```css
max-width: 1536px;     /* For dashboards */
margin: 0 auto;
padding: 0 2rem;
```

### Grid System

**12-Column Grid**
```css
display: grid;
grid-template-columns: repeat(12, 1fr);
gap: 1.5rem;          /* 24px */

/* Responsive */
@media (max-width: 1024px) {
  grid-template-columns: repeat(8, 1fr);
  gap: 1rem;          /* 16px */
}

@media (max-width: 640px) {
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;       /* 12px */
}
```

### Common Layouts

**Two-Column Layout (70/30)**
```css
display: grid;
grid-template-columns: 2fr 1fr;
gap: 2rem;

/* Video viewer: content + sidebar */
```

**Three-Column Grid**
```css
display: grid;
grid-template-columns: repeat(3, 1fr);
gap: 1.5rem;

/* Video cards on dashboard */
```

**Dashboard Layout**
```css
display: grid;
grid-template-areas:
  "sidebar header"
  "sidebar main";
grid-template-columns: 240px 1fr;
grid-template-rows: 64px 1fr;
```

### Border Radius

```css
--radius-none: 0;
--radius-sm:   0.125rem;  /* 2px */
--radius-base: 0.25rem;   /* 4px */
--radius-md:   0.375rem;  /* 6px */
--radius-lg:   0.5rem;    /* 8px */
--radius-xl:   0.75rem;   /* 12px */
--radius-2xl:  1rem;      /* 16px */
--radius-3xl:  1.5rem;    /* 24px */
--radius-full: 9999px;    /* Circle */
```

### Shadows

```css
/* Subtle elevation */
--shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);

/* Card elevation */
--shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1),
             0 1px 2px -1px rgba(0, 0, 0, 0.1);

/* Hover state */
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
             0 2px 4px -2px rgba(0, 0, 0, 0.1);

/* Modal/dropdown */
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
             0 4px 6px -4px rgba(0, 0, 0, 0.1);

/* Dramatic emphasis */
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1),
             0 8px 10px -6px rgba(0, 0, 0, 0.1);

/* Maximum depth */
--shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
```

---

## 🧩 Components

### Buttons

#### Primary Button
```css
/* Default state */
background: var(--blue-600);
color: white;
padding: 0.75rem 1.5rem;    /* 12px 24px */
border-radius: var(--radius-lg);
font-weight: 600;
font-size: 1rem;
border: none;
cursor: pointer;
transition: all 0.2s;
box-shadow: var(--shadow-sm);

/* Hover state */
&:hover {
  background: var(--blue-700);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

/* Active state */
&:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

/* Disabled state */
&:disabled {
  background: var(--gray-300);
  cursor: not-allowed;
  box-shadow: none;
}
```

#### Secondary Button
```css
background: white;
color: var(--gray-700);
border: 1px solid var(--gray-300);
padding: 0.75rem 1.5rem;
border-radius: var(--radius-lg);
font-weight: 600;
cursor: pointer;
transition: all 0.2s;

&:hover {
  border-color: var(--gray-400);
  box-shadow: var(--shadow-sm);
}
```

#### Ghost Button
```css
background: transparent;
color: var(--gray-700);
border: none;
padding: 0.75rem 1.5rem;
border-radius: var(--radius-lg);
font-weight: 600;
cursor: pointer;
transition: all 0.2s;

&:hover {
  background: var(--gray-100);
}
```

#### Danger Button
```css
background: var(--red-600);
color: white;
/* Rest same as primary */

&:hover {
  background: var(--red-700);
}
```

#### Button Sizes

**Small**
```css
padding: 0.5rem 1rem;      /* 8px 16px */
font-size: 0.875rem;       /* 14px */
```

**Medium (default)**
```css
padding: 0.75rem 1.5rem;   /* 12px 24px */
font-size: 1rem;           /* 16px */
```

**Large**
```css
padding: 1rem 2rem;        /* 16px 32px */
font-size: 1.125rem;       /* 18px */
```

### Input Fields

#### Text Input
```css
/* Default state */
width: 100%;
padding: 0.75rem 1rem;
border: 1px solid var(--gray-300);
border-radius: var(--radius-md);
font-size: 1rem;
color: var(--gray-900);
background: white;
transition: all 0.2s;

/* Focus state */
&:focus {
  outline: none;
  border-color: var(--blue-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Error state */
&.error {
  border-color: var(--red-500);
}

/* Disabled state */
&:disabled {
  background: var(--gray-100);
  cursor: not-allowed;
}
```

#### Text Area
```css
/* Same as text input, plus: */
min-height: 120px;
resize: vertical;
```

#### Select Dropdown
```css
/* Same as text input, plus: */
appearance: none;
background-image: url('chevron-down-icon.svg');
background-repeat: no-repeat;
background-position: right 0.75rem center;
padding-right: 2.5rem;
```

### Cards

#### Basic Card
```css
background: white;
border-radius: var(--radius-xl);
padding: 1.5rem;
box-shadow: var(--shadow-sm);
border: 1px solid var(--gray-200);
transition: all 0.2s;

&:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}
```

#### Video Card
```css
background: white;
border-radius: var(--radius-xl);
overflow: hidden;
box-shadow: var(--shadow-sm);
transition: all 0.2s;

/* Thumbnail */
.thumbnail {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

/* Content */
.content {
  padding: 1rem;
}

/* Title */
.title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--gray-900);
  margin-bottom: 0.5rem;
  line-height: 1.4;
  
  /* Truncate long titles */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Metadata */
.metadata {
  display: flex;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--gray-500);
}

&:hover {
  box-shadow: var(--shadow-md);
}
```

### Modals

```css
/* Backdrop */
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
}

/* Modal */
.modal {
  background: white;
  border-radius: var(--radius-2xl);
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: var(--shadow-2xl);
}

/* Header */
.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid var(--gray-200);
  
  .title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--gray-900);
  }
  
  .close-button {
    position: absolute;
    top: 1rem;
    right: 1rem;
  }
}

/* Body */
.modal-body {
  padding: 1.5rem;
}

/* Footer */
.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}
```

### Toast Notifications

```css
/* Container */
.toast {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  min-width: 320px;
  max-width: 480px;
  padding: 1rem 1.5rem;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 0.75rem;
  animation: slideIn 0.3s ease-out;
  z-index: 100;
}

/* Success */
.toast-success {
  background: var(--green-50);
  border: 1px solid var(--green-200);
  color: var(--green-800);
}

/* Error */
.toast-error {
  background: var(--red-50);
  border: 1px solid var(--red-200);
  color: var(--red-800);
}

/* Warning */
.toast-warning {
  background: var(--amber-50);
  border: 1px solid var(--amber-200);
  color: var(--amber-800);
}

/* Info */
.toast-info {
  background: var(--sky-50);
  border: 1px solid var(--sky-200);
  color: var(--sky-800);
}
```

### Progress Bars

```css
/* Container */
.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--gray-200);
  border-radius: var(--radius-full);
  overflow: hidden;
}

/* Fill */
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, 
    var(--blue-500), 
    var(--blue-600)
  );
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

/* With label */
.progress-with-label {
  .label {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    color: var(--gray-600);
  }
}
```

### Badges

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 500;
}

/* Default */
.badge-default {
  background: var(--gray-100);
  color: var(--gray-700);
}

/* Primary */
.badge-primary {
  background: var(--blue-100);
  color: var(--blue-700);
}

/* Success */
.badge-success {
  background: var(--green-100);
  color: var(--green-700);
}

/* Warning */
.badge-warning {
  background: var(--amber-100);
  color: var(--amber-700);
}

/* Error */
.badge-error {
  background: var(--red-100);
  color: var(--red-700);
}
```

---

## 🔄 User Flows

### 1. First-Time User Journey

```
Landing Page
    ↓
[See value prop + YouTube URL input]
    ↓
Paste YouTube URL (no login required)
    ↓
[Processing preview - see AI chunking in action]
    ↓
"Sign up to access full features" prompt
    ↓
Registration (email/Google/Apple)
    ↓
Dashboard with processed video
    ↓
Video viewer with all features unlocked
    ↓
[First time tooltips and onboarding]
```

**Key Screens:**
1. **Landing Page** - Hero with URL input
2. **Processing Preview** - Limited view to hook user
3. **Sign Up Modal** - Clear value prop
4. **Dashboard** - First video ready to explore
5. **Video Viewer** - Guided tour of features

### 2. Video Processing Flow

```
Dashboard
    ↓
Click "Process New Video" or paste URL in header
    ↓
YouTube URL input modal
    ↓
[Validation + metadata preview]
    ↓
Confirm processing
    ↓
Processing screen with progress
    ├─ Video analysis (25%)
    ├─ Transcription (50%)
    ├─ AI chunking (75%)
    └─ Finalizing (100%)
    ↓
Success notification
    ↓
Redirect to video viewer
```

**Key Screens:**
1. **URL Input Modal** - Clean, focused
2. **Processing Screen** - Live progress with estimates
3. **Video Viewer** - Auto-open when ready

### 3. Chat with Video Flow

```
Video Viewer
    ↓
Open chat tab in sidebar
    ↓
[Suggested questions displayed]
    ↓
Either:
- Click suggested question, OR
- Type custom question
    ↓
[AI processing indicator]
    ↓
Response appears in chat
    ↓
Can ask follow-ups
```

**Key Features:**
- Suggested questions based on content
- Chat history persists
- Can reference specific timestamps
- Quick actions (Summarize, Explain, Quiz)

### 4. Upgrade to Pro Flow

```
Hit free tier limit
    ↓
Soft limit warning notification
    ↓
"Upgrade to Pro" CTA
    ↓
Pricing comparison page
    ↓
Select plan
    ↓
Stripe checkout
    ↓
Success confirmation
    ↓
Dashboard with Pro features unlocked
```

**Key Screens:**
1. **Limit Warning** - Before hitting limit
2. **Pricing Page** - Clear feature comparison
3. **Checkout** - Stripe hosted
4. **Success** - Celebrate upgrade

---

## 📱 Page Designs

### Landing Page

#### Hero Section
```
┌──────────────────────────────────────────────┐
│                                              │
│  Transform YouTube Videos into Your          │
│     Personal Learning Library               │
│                                              │
│  AI-powered chunking, transcription, and     │
│  chat to learn faster from any video         │
│                                              │
│  ┌─────────────────────────────────────┐   │
│  │ https://youtube.com/watch?v=...    │   │
│  └─────────────────────────────────────┘   │
│                                              │
│         [Try it Free - No Sign Up] ───────▶ │
│                                              │
│  ✓ 3 free videos/month  ✓ No credit card    │
│                                              │
└──────────────────────────────────────────────┘
```

#### Features Section
```
How It Works
┌──────────┬──────────┬──────────┐
│    1️⃣    │    2️⃣    │    3️⃣    │
│  Paste   │   AI     │  Learn   │
│   URL    │ Analyzes │  Better  │
│          │          │          │
│ YouTube  │ Chunks   │ Chat &   │
│ video    │ video    │ explore  │
│ link     │ smartly  │ content  │
└──────────┴──────────┴──────────┘
```

#### Social Proof
```
Trusted by 10,000+ learners
[User testimonials with avatars]
```

#### Pricing Teaser
```
Start Free → Upgrade When Ready
[3-tier pricing cards]
```

#### CTA
```
Ready to Learn Smarter?
[Get Started Free] [View Demo]
```

### Dashboard

```
┌────────────────────────────────────────────────┐
│ Sidebar │ Header                                │
├─────────┼──────────────────────────────────────┤
│         │ Search [........................]     │
│ Videos  │                                       │
│         │ Your Videos (12)  [+ Process Video]  │
│ Settings│                                       │
│         │ ┌──────┐ ┌──────┐ ┌──────┐          │
│ Upgrade │ │Video │ │Video │ │Video │          │
│         │ │ #1   │ │ #2   │ │ #3   │          │
│ Logout  │ │      │ │      │ │      │          │
│         │ │ 15m  │ │ 8m   │ │ 23m  │          │
│         │ └──────┘ └──────┘ └──────┘          │
│         │                                       │
│         │ Continue Watching                     │
│         │ ┌──────────────────────┐             │
│         │ │ Last Video - 45% done│             │
│         │ └──────────────────────┘             │
└─────────┴──────────────────────────────────────┘
```

**Key Elements:**
- Sidebar navigation
- Search functionality
- Video grid with thumbnails
- Process new video CTA
- Continue watching section
- Usage indicator (free tier)

### Video Viewer

```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Dashboard          🔗 Share  ⋯ More          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌────────────────────────────────┐  ┌──────────────┐ │
│  │                                │  │              │ │
│  │                                │  │   Chunks     │ │
│  │       VIDEO PLAYER             │  │              │ │
│  │                                │  │  1. Intro    │ │
│  │                                │  │  2. Topic A  │ │
│  │                                │  │  3. Topic B  │ │
│  └────────────────────────────────┘  │              │ │
│                                       │ ────────────  │ │
│  [Timeline with chunk markers]        │              │ │
│                                       │ Transcript   │ │
│  Video Title Goes Here                │              │ │
│  Duration: 15:23 • Processed 2h ago   │ Full text... │ │
│                                       │              │ │
│  [Archive] [Download] [Delete]        │ ────────────  │ │
│                                       │              │ │
│                                       │    Chat      │ │
│                                       │              │ │
│                                       │ 💬 Ask me... │ │
│                                       └──────────────┘ │
└─────────────────────────────────────────────────────────┘
```

**Layout:**
- 70% video player + controls
- 30% sidebar with tabs (Chunks, Transcript, Chat)
- Persistent header with actions
- Timeline shows chunk markers
- Video metadata below player

### Settings Page

```
┌─────────────────────────────────────────┐
│ Settings                                │
├─────────────────────────────────────────┤
│                                         │
│ Profile                                 │
│ ├─ Avatar                               │
│ ├─ Name                                 │
│ └─ Email                                │
│                                         │
│ Subscription                            │
│ ├─ Current Plan: Pro                    │
│ ├─ Renews: March 1, 2026                │
│ └─ [Manage Subscription]                │
│                                         │
│ Preferences                             │
│ ├─ Video quality                        │
│ ├─ Auto-archive videos                  │
│ └─ Email notifications                  │
│                                         │
│ Danger Zone                             │
│ └─ [Delete Account]                     │
│                                         │
└─────────────────────────────────────────┘
```

---

## 📱 Responsive Design

### Breakpoints

```css
/* Mobile first approach */
--breakpoint-sm:  640px;   /* Small tablets */
--breakpoint-md:  768px;   /* Tablets */
--breakpoint-lg:  1024px;  /* Small laptops */
--breakpoint-xl:  1280px;  /* Desktops */
--breakpoint-2xl: 1536px;  /* Large screens */
```

### Mobile Optimizations

**Navigation:**
- Hamburger menu for mobile
- Bottom navigation bar for key actions
- Swipe gestures for sidebar

**Video Viewer:**
- Stack video player above content
- Tabs for Chunks/Transcript/Chat
- Full-width on mobile
- Tap timeline to navigate

**Cards:**
- Single column on mobile
- 2 columns on tablet
- 3-4 columns on desktop

**Typography:**
- Scale down heading sizes
- Increase body text line-height
- Larger tap targets (44px min)

---

## ♿ Accessibility

### WCAG 2.1 AA Compliance

#### Color Contrast
- Text: Minimum 4.5:1 ratio
- Large text (18pt+): Minimum 3:1 ratio
- UI elements: Minimum 3:1 ratio

#### Keyboard Navigation
- All interactive elements focusable
- Logical tab order
- Skip to main content link
- Focus indicators visible
- Keyboard shortcuts documented

#### Screen Readers
- Semantic HTML elements
- ARIA labels where needed
- Alt text for all images
- Live regions for dynamic content
- Descriptive link text

#### Motion
- Respect `prefers-reduced-motion`
- Provide play/pause for animations
- No auto-playing videos with sound
- Optional animation toggle

### Accessibility Checklist

- [ ] All images have alt text
- [ ] Form labels properly associated
- [ ] Color not sole indicator
- [ ] Focus states visible
- [ ] Heading hierarchy logical
- [ ] Tables have headers
- [ ] Captions for videos
- [ ] Error messages clear
- [ ] Links descriptive
- [ ] Zoom to 200% works

---

## ✨ Animation & Motion

### Animation Principles

1. **Purpose** - Every animation serves a purpose
2. **Performance** - Butter smooth 60fps
3. **Subtle** - Enhance, don't distract
4. **Fast** - Under 300ms for most
5. **Natural** - Ease curves feel organic

### Timing Functions

```css
--ease-in:      cubic-bezier(0.4, 0, 1, 1);
--ease-out:     cubic-bezier(0, 0, 0.2, 1);
--ease-in-out:  cubic-bezier(0.4, 0, 0.2, 1);
--ease-bounce:  cubic-bezier(0.68, -0.55, 0.265, 1.55);
```

### Common Animations

**Fade In**
```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

animation: fadeIn 0.3s ease-out;
```

**Slide Up**
```css
@keyframes slideUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

animation: slideUp 0.4s ease-out;
```

**Hover Lift**
```css
transition: transform 0.2s ease-out, box-shadow 0.2s ease-out;

&:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

**Button Press**
```css
&:active {
  transform: scale(0.98);
}
```

**Loading Spinner**
```css
@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

animation: spin 1s linear infinite;
```

### Page Transitions

```css
/* Page enter */
@keyframes pageEnter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Stagger children */
.stagger-children > * {
  animation: pageEnter 0.4s ease-out;
  animation-fill-mode: both;
}

.stagger-children > *:nth-child(1) { animation-delay: 0.05s; }
.stagger-children > *:nth-child(2) { animation-delay: 0.1s; }
.stagger-children > *:nth-child(3) { animation-delay: 0.15s; }
```

---

## 🌙 Dark Mode

### Color System (Dark)

```css
/* Dark mode colors */
--bg-primary:    #0f172a;    /* Slate 900 */
--bg-secondary:  #1e293b;    /* Slate 800 */
--bg-tertiary:   #334155;    /* Slate 700 */

--text-primary:   #f1f5f9;   /* Slate 100 */
--text-secondary: #cbd5e1;   /* Slate 300 */
--text-tertiary:  #94a3b8;   /* Slate 400 */

--border-color:   #334155;   /* Slate 700 */
```

### Implementation

```css
/* Automatic dark mode */
@media (prefers-color-scheme: dark) {
  :root {
    /* Override light mode variables */
  }
}

/* Manual toggle */
[data-theme="dark"] {
  /* Dark mode variables */
}
```

### Dark Mode Adjustments

- Reduce shadows (less pronounced)
- Lower contrast ratios
- Warmer whites (#f8f8f8 not pure white)
- Adjust primary colors (slightly desaturated)
- Test all states (hover, focus, active)

---

## 🎨 Design Tokens

### CSS Custom Properties

```css
:root {
  /* Colors - See color system above */
  
  /* Typography */
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Spacing */
  --space-unit: 0.25rem;  /* 4px base */
  
  /* Timing */
  --duration-fast:   150ms;
  --duration-normal: 250ms;
  --duration-slow:   400ms;
  
  /* Z-index layers */
  --z-dropdown:  10;
  --z-sticky:    20;
  --z-modal:     50;
  --z-tooltip:   60;
  --z-toast:     100;
}
```

---

## 🎨 Figma Resources

### Design File Structure

```
📁 Video Learning Platform
├─ 🎨 Design System
│  ├─ Colors
│  ├─ Typography
│  ├─ Components
│  └─ Icons
├─ 📱 Pages - Mobile
│  ├─ Landing
│  ├─ Dashboard
│  └─ Video Viewer
├─ 💻 Pages - Desktop
│  ├─ Landing
│  ├─ Dashboard
│  └─ Video Viewer
└─ 🔄 User Flows
```

### Component Library

**Base Components:**
- Buttons (all variants)
- Input fields
- Cards
- Modals
- Toasts
- Badges
- Progress bars
- Loading states

**Complex Components:**
- Video player
- Chat interface
- Chunk timeline
- Dashboard widgets
- Pricing cards
- Authentication forms

### Design Handoff

**For Developers:**
1. Export assets at 1x, 2x, 3x
2. Include component specs
3. Document interactions
4. Provide design tokens
5. Include prototype links

---

## 📋 Design Checklist

### Before Development

- [ ] All pages designed for mobile & desktop
- [ ] Component library complete
- [ ] Design system documented
- [ ] Colors pass accessibility checks
- [ ] Typography hierarchy clear
- [ ] Spacing consistent
- [ ] User flows validated
- [ ] Prototype tested with users
- [ ] Assets exported
- [ ] Handoff documentation ready

### During Development

- [ ] Design system implemented
- [ ] Components match designs
- [ ] Responsive behavior correct
- [ ] Animations smooth
- [ ] Dark mode works
- [ ] Accessibility requirements met
- [ ] Cross-browser tested
- [ ] Performance optimized

---

## 🎯 Next Steps

1. **Create Figma File** - Set up design system
2. **Design Key Screens** - Landing, dashboard, video viewer
3. **Build Component Library** - Reusable UI elements
4. **Get Feedback** - Test with potential users
5. **Iterate** - Refine based on feedback
6. **Handoff** - Prepare for development

---

**Design Version:** 1.0
**Last Updated:** February 2026
**Designer:** [Your Name]

*This is a living document. Update as the design evolves.*
