DESIGN SYSTEM (REQUIRED):

- Platform: Mobile (iOS-style), Mobile-first
- Theme: Dark, sophisticated, cinematic — deep blacks with vibrant accent pops
- Background: Deep Void Black (#0A0A0F) for main canvas
- Surface: Elevated Charcoal (#13131A) for cards and panels
- Surface Raised: Midnight Slate (#1C1C28) for elevated containers
- Primary Accent: Electric Indigo (#5C6BFF) for primary buttons, highlights, and active states
- Secondary Accent: Vivid Cyan (#00D4FF) for timeline selection range and time markers
- Success/Approved: Emerald Mint (#00C48C) for approved/completed badges
- Warning/Attention: Warm Amber (#FFB020) for pending or editable states
- Destructive/Cut: Coral Red (#FF4757) for cut action buttons and destructive states
- Text Primary: Pure White (#FFFFFF) for headings and primary labels
- Text Secondary: Silver Mist (#A0A0B8) for subtitles and timestamps
- Text Muted: Dim Gray (#5A5A72) for placeholder and disabled states
- Timeline Track: Dark Navy (#1A1A2E) for the waveform/timeline background
- Timeline Selection Highlight: Electric Indigo at 30% opacity (#5C6BFF4D) overlay
- Timeline Marker: Vivid Cyan (#00D4FF) vertical needle line
- Buttons: Rounded pill shape (24px radius) for primary CTAs, sharp rectangle (8px radius) for secondary
- Cards: 16px radius with subtle 1px border (#2A2A3E) and soft glow shadow
- Bottom Navigation: Frosted glass effect, blur 24px, dark base with 5 icon tabs
- Typography: SF Pro Display (headings), SF Pro Text (body), monospace for timestamps
- Floating Action Bubble: 56px diameter circle, Electric Indigo (#5C6BFF) with white icon, subtle pulsing shadow animation
- Status Bar: Dark, battery/signal icons in white
  SCREEN 1 — Main Video Editor with Interactive Timeline
  A cinematic, dark-themed mobile video editor workspace with an advanced interactive timeline,
  AI cut suggestions panel, and a floating action bubble — designed for professional-grade video editing on mobile.
  DESIGN SYSTEM (REQUIRED):
  [Paste the full shared design system block above]
  Page Structure:

1. Status Bar & Navigation Header:
   - Top status bar: dark background, white status icons (time "9:41", signal bars, battery)
   - Header row: "< Back" chevron-left back button (text link, white), centered bold title "Video Editor",
     right side: three-dot vertical options menu icon
   - Clean separator line below header
2. Video Preview Player:
   - Full-width video thumbnail preview (16:9 aspect ratio) with a dark overlay
   - Video title text overlaid bottom-left: white bold heading "React Hooks — The Definitive Guide"
     subtitle below: silver mist text
   - Centered play button: large circular white play icon (48px) with frosted glass background
   - Timestamp row below the video: left-aligned current time "47:20" and right-aligned total duration "2:14:58",
     both in monospace font, silver mist color
3. Interactive Video Timeline:
   - Full-width horizontal scrubber timeline track on dark navy (#1A1A2E) background
   - Waveform visualization: thin vertical bars representing audio amplitude, colored in
     indigo (#5C6BFF) at 50% opacity across the full width
   - TIME MARKER: A vivid cyan (#00D4FF) vertical needle line spanning the full height of
     the timeline, with a small upward-pointing triangle handle at the top (draggable)
   - SELECTION RANGE HIGHLIGHT: A semi-transparent Electric Indigo (#5C6BFF4D) overlay
     rectangle spanning between two drag handles — a START POINT handle (left) and
     an END POINT handle (right); each handle is a rounded rectangular grip in white
     with a vertical double-line grip texture, 4px wide × 32px tall
   - Time labels: small monospace timestamps displayed above the start and end handles
     (e.g., "0:42:10" and "1:05:30") in vivid cyan color
   - Below the timeline track: a row of thumbnail strip frames (small video frames,
     ~40px × 28px each) showing video frames at intervals, scrollable horizontally
4. Timeline Action Controls (below timeline):
   - Horizontal row of two icon-label action buttons centered:
     - "✂ Cut" button: pill-shaped, coral red (#FF4757) background, white text and scissors icon
     - "⊟ Split" button: pill-shaped, outlined style with Electric Indigo border,
       white text and split icon (two vertical lines with a gap)
   - Small helper text below: "Drag handles to set selection range" in dim gray muted text
5. AI Cut Suggestions Section:
   - Section header: bold white text "Cut Suggestions" on the left,
     right-aligned chip badge showing "1 of 4 approved" in emerald mint (#00C48C) color
   - Horizontal scrollable row of numbered segment chip buttons above the list:
     chips "1", "2", "3", "4" — active chip has Electric Indigo background, others are outlined
   - Vertically stacked suggestion cards (show 2 cards, rest scrollable):
     CARD STYLE: 16px radius, Elevated Charcoal (#13131A) background, subtle indigo border glow on hover
     Card 1 (approved state):
     - Top row: numbered blue circle "①" icon, bold white title "Introduction & What are Hooks?"
     - Timestamp row: "0:42 → 10:58" with small duration badge "→ 10 min 26 sec" in silver mist
     - Description: 2-line italic silver mist text preview of transcript excerpt
     - Action row: "✂ Cut" button (coral red pill) + "⏱ Full Time" toggle button (indigo outlined pill)
     - Top-right: small "Approved" badge in emerald mint
       Card 2 (unapproved state):
     - Top row: numbered circle "②", bold white title "Introduction & What are Hooks?"
     - Timestamp: "0:25 → 0:28 → 30 sec" in silver mist
     - Description: italic truncated transcript text
     - Action row: "✂ Cut" button + "▶ Full Video" button (both pill-shaped)
     - No approved badge
6. Bottom Navigation Bar:
   - Full-width frosted glass bottom nav bar with 5 tabs:
     - "Dashboard" (grid icon), "Library" (stack of cards icon),
       "Editor" (center, large elevated Electric Indigo circle with video-cut/scissors icon — active state),
       "Chat" (speech bubble icon), "Research" (magnifying glass icon)
   - Active "Editor" tab has pulsing indigo glow behind the elevated circle button
   - Inactive tabs: silver mist icons with small text labels below
7. Floating Action Bubble:
   - A 56px diameter floating pill/circle button positioned bottom-right, above the nav bar
   - Electric Indigo (#5C6BFF) solid background with a white "+" or sparkle/magic wand icon
   - Subtle pulsing outer glow animation ring in indigo at 20% opacity
   - Elevation: highest z-layer, above all content
     📱 SCREEN 2 — AI Cut Suggestions Panel (Expanded View)
     A full-screen AI cut suggestions panel overlaid on the video editor workspace, showing
     all AI-predicted cut segments with editable mini-timelines, download controls, and approval management.
     DESIGN SYSTEM (REQUIRED):
     [Paste the full shared design system block above]
     Page Structure:
8. Status Bar & Navigation Header:
   - Dark status bar with white icons
   - Header: "< Back" left arrow, centered bold title "Video Editor"
   - Below header: a horizontal tab bar with 3 pill tabs:
     "Transcripts" | "Chat" | "Cut Clips" — "Cut Clips" tab is active
     (active tab: Electric Indigo pill background, white text;
     inactive: transparent with silver mist text)
9. Cut Clips Section Header:
   - Row: bold white heading "Cut Clips" on left,
     right-aligned chip: "3 approved" in emerald mint green with checkmark icon
10. Scrollable List of Cut Clip Cards (show 3–4 visible, rest scrollable):
    CARD STYLE: Full-width, Elevated Charcoal (#13131A) background, 16px radius, 1px border (#2A2A3E)

    Each card contains:
    - Left: small circular thumbnail preview of the video clip (48px diameter, rounded)
    - Center: clip title in bold white (e.g., "Introduction"), duration badge in silver mist (e.g., "40 - 61")
    - Right: download icon button (downward arrow in a circle, Electric Indigo tint),
      and a small up-arrow expand/collapse chevron
      Card 1 — "Introduction" (0:40 - 1:01):
    - Thumbnail: dark video frame
    - Title: bold white "Introduction"
    - Duration: silver mist "0:40 - 1:01"
    - Right actions: download icon + expand chevron
      Card 2 — "useBasic" (1:1 - 1:41):
    - Same card layout as above
      Card 3 — "useState" (1:1 - 1:41):
    - Same card layout

11. "Download All" Primary CTA Button:
    - Full-width pill button, Electric Indigo (#5C6BFF) gradient background
    - White bold text "Download All" with a download/cloud-download icon on the right
    - Large vertical spacing above it, resting at bottom of the scrollable content
12. Bottom Navigation Bar:
    - Same frosted glass 5-tab nav as Screen 1
    - "Editor" still shown as active (center elevated circle)
13. Floating Action Bubble:
    - Same 56px indigo floating circle button, bottom-right above nav bar
      YouTube Cutter — Stitch UI Redesign Prompt (4 Screens)
      Usage: Copy each screen prompt separately into Stitch to generate each screen. Start with Screen 1 to establish the design system, then reference it for Screens 2–4.
      🎨 SHARED DESIGN SYSTEM (REQUIRED FOR ALL SCREENS)
      DESIGN SYSTEM (REQUIRED):

- Platform: Mobile (iOS-style), Mobile-first
- Theme: Dark, sophisticated, cinematic — deep blacks with vibrant accent pops
- Background: Deep Void Black (#0A0A0F) for main canvas
- Surface: Elevated Charcoal (#13131A) for cards and panels
- Surface Raised: Midnight Slate (#1C1C28) for elevated containers
- Primary Accent: Electric Indigo (#5C6BFF) for primary buttons, highlights, and active states
- Secondary Accent: Vivid Cyan (#00D4FF) for timeline selection range and time markers
- Success/Approved: Emerald Mint (#00C48C) for approved/completed badges
- Warning/Attention: Warm Amber (#FFB020) for pending or editable states
- Destructive/Cut: Coral Red (#FF4757) for cut action buttons and destructive states
- Text Primary: Pure White (#FFFFFF) for headings and primary labels
- Text Secondary: Silver Mist (#A0A0B8) for subtitles and timestamps
- Text Muted: Dim Gray (#5A5A72) for placeholder and disabled states
- Timeline Track: Dark Navy (#1A1A2E) for the waveform/timeline background
- Timeline Selection Highlight: Electric Indigo at 30% opacity (#5C6BFF4D) overlay
- Timeline Marker: Vivid Cyan (#00D4FF) vertical needle line
- Buttons: Rounded pill shape (24px radius) for primary CTAs, sharp rectangle (8px radius) for secondary
- Cards: 16px radius with subtle 1px border (#2A2A3E) and soft glow shadow
- Bottom Navigation: Frosted glass effect, blur 24px, dark base with 5 icon tabs
- Typography: SF Pro Display (headings), SF Pro Text (body), monospace for timestamps
- Floating Action Bubble: 56px diameter circle, Electric Indigo (#5C6BFF) with white icon, subtle pulsing shadow animation
- Status Bar: Dark, battery/signal icons in white
  📱 SCREEN 1 — Main Video Editor with Interactive Timeline
  A cinematic, dark-themed mobile video editor workspace with an advanced interactive timeline,
  AI cut suggestions panel, and a floating action bubble — designed for professional-grade video editing on mobile.
  DESIGN SYSTEM (REQUIRED):
  [Paste the full shared design system block above]
  Page Structure:

1. Status Bar & Navigation Header:
   - Top status bar: dark background, white status icons (time "9:41", signal bars, battery)
   - Header row: "< Back" chevron-left back button (text link, white), centered bold title "Video Editor",
     right side: three-dot vertical options menu icon
   - Clean separator line below header
2. Video Preview Player:
   - Full-width video thumbnail preview (16:9 aspect ratio) with a dark overlay
   - Video title text overlaid bottom-left: white bold heading "React Hooks — The Definitive Guide"
     subtitle below: silver mist text
   - Centered play button: large circular white play icon (48px) with frosted glass background
   - Timestamp row below the video: left-aligned current time "47:20" and right-aligned total duration "2:14:58",
     both in monospace font, silver mist color
3. Interactive Video Timeline:
   - Full-width horizontal scrubber timeline track on dark navy (#1A1A2E) background
   - Waveform visualization: thin vertical bars representing audio amplitude, colored in
     indigo (#5C6BFF) at 50% opacity across the full width
   - TIME MARKER: A vivid cyan (#00D4FF) vertical needle line spanning the full height of
     the timeline, with a small upward-pointing triangle handle at the top (draggable)
   - SELECTION RANGE HIGHLIGHT: A semi-transparent Electric Indigo (#5C6BFF4D) overlay
     rectangle spanning between two drag handles — a START POINT handle (left) and
     an END POINT handle (right); each handle is a rounded rectangular grip in white
     with a vertical double-line grip texture, 4px wide × 32px tall
   - Time labels: small monospace timestamps displayed above the start and end handles
     (e.g., "0:42:10" and "1:05:30") in vivid cyan color
   - Below the timeline track: a row of thumbnail strip frames (small video frames,
     ~40px × 28px each) showing video frames at intervals, scrollable horizontally
4. Timeline Action Controls (below timeline):
   - Horizontal row of two icon-label action buttons centered:
     - "✂ Cut" button: pill-shaped, coral red (#FF4757) background, white text and scissors icon
     - "⊟ Split" button: pill-shaped, outlined style with Electric Indigo border,
       white text and split icon (two vertical lines with a gap)
   - Small helper text below: "Drag handles to set selection range" in dim gray muted text
5. AI Cut Suggestions Section:
   - Section header: bold white text "Cut Suggestions" on the left,
     right-aligned chip badge showing "1 of 4 approved" in emerald mint (#00C48C) color
   - Horizontal scrollable row of numbered segment chip buttons above the list:
     chips "1", "2", "3", "4" — active chip has Electric Indigo background, others are outlined
   - Vertically stacked suggestion cards (show 2 cards, rest scrollable):
     CARD STYLE: 16px radius, Elevated Charcoal (#13131A) background, subtle indigo border glow on hover
     Card 1 (approved state):
     - Top row: numbered blue circle "①" icon, bold white title "Introduction & What are Hooks?"
     - Timestamp row: "0:42 → 10:58" with small duration badge "→ 10 min 26 sec" in silver mist
     - Description: 2-line italic silver mist text preview of transcript excerpt
     - Action row: "✂ Cut" button (coral red pill) + "⏱ Full Time" toggle button (indigo outlined pill)
     - Top-right: small "Approved" badge in emerald mint
       Card 2 (unapproved state):
     - Top row: numbered circle "②", bold white title "Introduction & What are Hooks?"
     - Timestamp: "0:25 → 0:28 → 30 sec" in silver mist
     - Description: italic truncated transcript text
     - Action row: "✂ Cut" button + "▶ Full Video" button (both pill-shaped)
     - No approved badge
6. Bottom Navigation Bar:
   - Full-width frosted glass bottom nav bar with 5 tabs:
     - "Dashboard" (grid icon), "Library" (stack of cards icon),
       "Editor" (center, large elevated Electric Indigo circle with video-cut/scissors icon — active state),
       "Chat" (speech bubble icon), "Research" (magnifying glass icon)
   - Active "Editor" tab has pulsing indigo glow behind the elevated circle button
   - Inactive tabs: silver mist icons with small text labels below
7. Floating Action Bubble:
   - A 56px diameter floating pill/circle button positioned bottom-right, above the nav bar
   - Electric Indigo (#5C6BFF) solid background with a white "+" or sparkle/magic wand icon
   - Subtle pulsing outer glow animation ring in indigo at 20% opacity
   - Elevation: highest z-layer, above all content
     📱 SCREEN 2 — AI Cut Suggestions Panel (Expanded View)
     A full-screen AI cut suggestions panel overlaid on the video editor workspace, showing
     all AI-predicted cut segments with editable mini-timelines, download controls, and approval management.
     DESIGN SYSTEM (REQUIRED):
     [Paste the full shared design system block above]
     Page Structure:
8. Status Bar & Navigation Header:
   - Dark status bar with white icons
   - Header: "< Back" left arrow, centered bold title "Video Editor"
   - Below header: a horizontal tab bar with 3 pill tabs:
     "Transcripts" | "Chat" | "Cut Clips" — "Cut Clips" tab is active
     (active tab: Electric Indigo pill background, white text;
     inactive: transparent with silver mist text)
9. Cut Clips Section Header:
   - Row: bold white heading "Cut Clips" on left,
     right-aligned chip: "3 approved" in emerald mint green with checkmark icon
10. Scrollable List of Cut Clip Cards (show 3–4 visible, rest scrollable):
    CARD STYLE: Full-width, Elevated Charcoal (#13131A) background, 16px radius, 1px border (#2A2A3E)
    Each card contains:
    - Left: small circular thumbnail preview of the video clip (48px diameter, rounded)
    - Center: clip title in bold white (e.g., "Introduction"), duration badge in silver mist (e.g., "40 - 61")
    - Right: download icon button (downward arrow in a circle, Electric Indigo tint),
      and a small up-arrow expand/collapse chevron
      Card 1 — "Introduction" (0:40 - 1:01):
    - Thumbnail: dark video frame
    - Title: bold white "Introduction"
    - Duration: silver mist "0:40 - 1:01"
    - Right actions: download icon + expand chevron
      Card 2 — "useBasic" (1:1 - 1:41):
    - Same card layout as above
      Card 3 — "useState" (1:1 - 1:41):
    - Same card layout
11. "Download All" Primary CTA Button:
    - Full-width pill button, Electric Indigo (#5C6BFF) gradient background
    - White bold text "Download All" with a download/cloud-download icon on the right
    - Large vertical spacing above it, resting at bottom of the scrollable content
12. Bottom Navigation Bar:
    - Same frosted glass 5-tab nav as Screen 1
    - "Editor" still shown as active (center elevated circle)
13. Floating Action Bubble:
    - Same 56px indigo floating circle button, bottom-right above nav bar
      📱 SCREEN 3 — Transcription Panel (Workspace Side Panel)
      A full-screen transcription view embedded within the video editor workspace (not a navigation
      break), displaying time-coded transcript lines with highlighted active segment, smooth scrolling
      reader experience with cinematic dark typography.
      DESIGN SYSTEM (REQUIRED):
      [Paste the full shared design system block above]
      Page Structure:
14. Status Bar & Navigation Header:
    - Dark status bar
    - Header: "< Back", centered "Video Editor" title
    - Tab bar: "Transcripts" | "Chat" | "Cut Clips" — "Transcripts" tab active (Electric Indigo pill)
15. Transcript Scrollable Reader Area:
    - Full-width, dark background (#0A0A0F), generous vertical padding
    - Each transcript entry is a row containing:
      - LEFT: timestamp in vivid cyan (#00D4FF) monospace font (e.g., "0:00", "0:16")
        — fixed-width column, right-aligned to timestamp column
      - RIGHT: transcript text in white (primary) or silver mist (secondary/past) depending on
        whether it is the current active segment
    - ACTIVE LINE HIGHLIGHT: The current transcript line has a subtle left border accent
      in Electric Indigo (4px solid vertical bar), slightly elevated background
      (#1C1C28 surface raised), and text in full white bold
    - Past lines: silver mist (#A0A0B8) text, smaller weight
    - Future lines: dim gray (#5A5A72) text, italic
      SAMPLE TRANSCRIPT ENTRIES (show 5–7 lines):
    - 0:00 | "Hey everyone, welcome to this complete React Hooks course. Today I will cover everything you need to know."
    - 0:16 | "We'll start with the fundamentals: these are tools for state management with sections, plus officials with use, test, and zero basics." [HIGHLIGHTED/ACTIVE — vivid cyan timestamp, full white text, indigo left bar]
    - 0:38 | "Hooks were introduced in React 16. But not completely phased out, so we'll use React components. Let me share why they matter."
    - 1:08 | "Now let's dive into useState. This is the most fundamental hook and you'll see it in almost every component you build."
    - 1:29 | "useState lets you add state to functional elements. The function accepts 2 elements. The current value is called function to update the value. Let me show you a counter example."
16. Bottom Navigation Bar:
    - Same frosted glass 5-tab nav
    - "Editor" center tab remains the active elevated indigo circle
17. Floating Action Bubble:
    - Same indigo floating bubble, bottom-right corner
      📱 SCREEN 4 — Floating Bubble Menu (Side Panel Radial/Drawer Menu)
      A floating action bubble tap triggers a sleek right-side slide-in drawer menu panel that appears
      as an overlay ON TOP of the video editor workspace (the workspace remains visible but dimmed
      behind it). The menu contains 4 navigation sections for Cut Clips, Transcription, Chat with AI,
      and Deep Research.
      DESIGN SYSTEM (REQUIRED):
      [Paste the full shared design system block above]
      Page Structure:
18. Dimmed Background Overlay:
    - The main video editor workspace is visible but behind a dark scrim overlay
      (rgba(0,0,0,0.65)) creating depth separation
    - The floating action bubble is now shown as an "X" close icon (still Electric Indigo circle)
      at the bottom-right, indicating the menu is open
19. Right-Side Slide-In Panel Drawer:
    - Positioned: right edge of screen, approximately 75% screen width
    - Background: Midnight Slate (#1C1C28) with frosted glass blur effect
    - Left edge: subtle Electric Indigo vertical glow line (2px, 40% opacity) marking the panel edge
    - Top of drawer: small horizontal grab handle pill (white, 40px wide, 4px tall, centered)
    - Panel title row: bold white text "Quick Actions", small silver mist subtitle "Select a section"
20. Menu Items — 4 Large Tappable Cards:
    Each menu item is a full-width card (14px radius, Elevated Charcoal #13131A background,
    1px border #2A2A3E, 16px padding, subtle hover glow):
    CARD 1 — "Cut Videos":
    - Left icon: 48px rounded square with coral red (#FF4757) background and scissors icon in white
    - Title: bold white "Cut Videos"
    - Subtitle: silver mist "View and download all your cut clips"
    - Right: chevron-right arrow in dim gray
    - On tap: shows the Cut Clips panel (Screen 2) as an in-workspace overlay — does NOT navigate away
      CARD 2 — "Transcription":
    - Left icon: 48px rounded square with Electric Indigo (#5C6BFF) background and text-lines/document icon
    - Title: bold white "Transcription"
    - Subtitle: silver mist "Read the full auto-generated transcript"
    - Right: chevron-right arrow
      CARD 3 — "Chat with Video":
    - Left icon: 48px rounded square with vivid cyan (#00D4FF) background and chat-bubble/AI sparkle icon
    - Title: bold white "Chat with Video"
    - Subtitle: silver mist "Ask questions and add additional videos to the chat"
    - Right: chevron-right arrow
    - Bonus: small glowing "AI" badge chip in top-right corner of icon square
      CARD 4 — "Deep Research":
    - Left icon: 48px rounded square with warm amber (#FFB020) background and globe/search icon in white
    - Title: bold white "Deep Research"
    - Subtitle: silver mist "Research this video topic deeper across the internet"
    - Right: chevron-right arrow
    - Bonus: small "NEW" badge chip in Electric Indigo on top-right of the icon square
21. Bottom of Drawer:
    - A subtle "Swipe left to close" helper label in dim gray muted text with a left-arrow icon
    - Matches the bottom safe area / home indicator of the mobile device
22. Floating Action Bubble (Close State):
    - Same 56px indigo circle, now showing white "×" close icon
    - Subtle red-tinted outer glow replacing the indigo glow to signal close state
