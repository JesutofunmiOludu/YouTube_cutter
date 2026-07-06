---
page: chat_with_video
---
An AI Chat interface overlaid inside the video editor workspace, allowing the user to type questions about the video content, receive summarized answers, and see an attachment area where they can add additional videos to the context.

**DESIGN SYSTEM (REQUIRED):**
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

**Page Structure:**
1. **Status Bar & Navigation Header**:
   - Dark status bar with white icons
   - Header: "< Back" left arrow, centered "Video Editor" title, right options menu
   - Tab bar below: "Transcripts" | "Chat" | "Cut Clips" — "Chat" tab is active (active: Electric Indigo pill background, white text; inactive: transparent with silver mist text)
2. **Chat Messages View**:
   - Scrollable messages stream. Messages are bubbles:
     - User bubble: right-aligned, Midnight Slate (#1C1C28) background, white text
     - AI assistant bubble: left-aligned, Elevated Charcoal (#13131A) background with a small Electric Indigo border glow, white text. Small sparkle icon next to message. Monospaced timestamps included (e.g., "[0:16]") which are clickable to jump to that timestamp in the video
3. **"Add Additional Videos" Attachment Tray**:
   - Small horizontal scrolling strip above the chat input input box
   - Displays thumbnails of attached videos with a small close/remove "x" badge on each
   - Includes a dashed border add-button box: "+ Add Video"
4. **Chat Input Box**:
   - Centered text input box, pill-shaped, Elevated Charcoal (#13131A) background, white text
   - Placeholder: "Ask about this video..." in dim gray
   - Right side of input: circular send button (Electric Indigo background, white arrow icon)
5. **Bottom Navigation Bar**:
   - Same frosted glass 5-tab nav (Editor active)
6. **Floating Action Bubble**:
   - Same 56px indigo floating bubble, bottom-right corner
