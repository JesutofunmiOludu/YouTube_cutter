# Camera Flight Animation, Direct Hub Lines & Thumbnail Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement smooth programmatic camera flight with zoom, a "Back to Overview" button, direct hub-and-spoke lines from the video title in Mindmap, rich 16:9 video thumbnails on the central card, micro-thumbnails on node cards, and default-collapsed clusters when nodes > 10.

**Architecture:** Extend `CanvasShell` with a hardware-accelerated camera transition engine (`cubic-bezier(0.16, 1, 0.3, 1)`) and floating breadcrumb; update `useGroupedNodes` to collapse clusters on initialization when node count > 10; rewrite Mindmap geometry to radiate direct lines from the central video card to each spoke; embed YouTube thumbnails on the center card and individual node cards.

**Tech Stack:** Next.js (React 18), Tailwind CSS, Lucide React, TypeScript, Django backend.

**Spec:** `docs/superpowers/specs/2026-11-03-camera-flight-thumbnails-design.md`

## Global Constraints

- Smooth camera transitions must use `cubic-bezier(0.16, 1, 0.3, 1)` with a 550ms duration.
- During user pan/drag or pinch-zoom, transitions must switch to instant or 75ms to prevent lag.
- Default to all clusters collapsed when total node count > 10.
- Mindmap lines must connect directly from the central video card to each node/cluster without intermediate branch curves.
- Central video card must display the 16:9 YouTube video thumbnail with gradient overlay, duration pill, and play badge.
- Node cards must display a thumbnail header with an embedded timestamp badge (`MM:SS`).
- Zero TypeScript errors (`npx tsc --noEmit`).

## Review Focus

1. **Camera overshoot or coordinate desync:** Gliding to a cluster must center the group precisely without clipping outside the viewport.
2. **Dragging while camera is in flight:** User mouse-down or touch during flight must instantly cancel the programmatic animation and latch to pointer.
3. **Missing or broken YouTube thumbnails:** If `thumbnail_url` is missing or fails to load, gracefully fall back to `https://img.youtube.com/vi/${youtube_id}/hqdefault.jpg` or an elegant gradient SVG pattern.
4. **Line-card intersection:** Direct lines must anchor cleanly at the edges of the center card and node cards, never drawing across card text.
5. **Back to Overview state reset:** Clicking "Back to Overview" must reset camera zoom to overview and restore opacity to all dimmed nodes.

---

### Task 1: Camera Flight Engine & Breadcrumb in `CanvasShell.tsx`

**Files:**
- Modify: `Frontend/youtube/components/canvas/CanvasShell.tsx`

**Interfaces:**
- Produces: `flyTo: (targetX: number, targetY: number, targetZoom?: number) => void`, `resetCamera: () => void`, `isFocused: boolean` in `children` callback.

- [ ] **Step 1: Add camera flight state and `flyTo` method in `CanvasShell.tsx`**
  - Add `isFlying: boolean` and `isFocused: boolean` state.
  - Implement `flyTo(targetX: number, targetY: number, targetZoom: number = 1.35)`:
    - Sets `isFlying(true)`, `isFocused(true)`.
    - Updates `pan` to `{-targetX * targetZoom, -targetY * targetZoom}` and `zoom` to `targetZoom`.
    - Resets `isFlying` to `false` after 560ms timeout.
  - Implement `resetCamera()`:
    - Sets `isFlying(true)`, `isFocused(false)`.
    - Resets `pan` to `{ x: 0, y: 0 }` and `zoom` to `initialZoom`.
    - Resets `isFlying` to `false` after 560ms timeout.
  - Interrupt flight on user manual interaction (`handleMouseDown`, `handleTouchStart`, `handleWheel`).

- [ ] **Step 2: Add hardware-accelerated transition style to infinite world surface**
  - Apply `transition: isFlying ? 'transform 550ms cubic-bezier(0.16, 1, 0.3, 1)' : 'transform 75ms ease-out'`.

- [ ] **Step 3: Add floating `← Back to Overview` glass button**
  - Position: `absolute top-5 left-1/2 -translate-x-1/2 z-30`.
  - Render conditionally when `isFocused` is true.
  - Style: `bg-white/95 border border-slate-200/90 text-slate-800 shadow-xl backdrop-blur-md px-4 py-2 rounded-full font-semibold text-xs flex items-center gap-2 hover:bg-slate-50 transition-all active:scale-95`.
  - On click: calls `resetCamera()`.

- [ ] **Step 4: Update `children` prop signature to pass `flyTo`, `resetCamera`, and `isFocused`**

- [ ] **Step 5: Verify TypeScript compilation**
  Run: `cd Frontend/youtube; npx tsc --noEmit`
  Expected: PASS with 0 errors.

---

### Task 2: Default Collapsed Logic for >10 Nodes in `useGroupedNodes.ts`

**Files:**
- Modify: `Frontend/youtube/components/canvas/hooks/useGroupedNodes.ts`

**Interfaces:**
- Consumes: `totalNodesCount` from payload.
- Produces: Initial `expandedGroups` as empty `Set` if `totalNodesCount > 10`.

- [ ] **Step 1: Update initial state in `useGroupedNodes`**
  - If `initialExpandedAll` is false or `totalNodesCount > 10`, initialize `expandedGroups` to `new Set()`.
  - Only auto-expand if `totalNodesCount <= 10` and `initialExpandedAll === true`.

- [ ] **Step 2: Verify TypeScript compilation**
  Run: `cd Frontend/youtube; npx tsc --noEmit`
  Expected: PASS with 0 errors.

---

### Task 3: Mindmap Direct Hub-and-Spoke Topology & Thumbnail Integration in `MindmapCanvas.tsx`

**Files:**
- Modify: `Frontend/youtube/components/canvas/formats/MindmapCanvas.tsx`

**Interfaces:**
- Consumes: `flyTo`, `resetCamera`, `isFocused` from `CanvasShell`.
- Produces: Direct hub lines, 16:9 center thumbnail card, node micro-thumbnail cards, camera fly-to on cluster click.

- [ ] **Step 1: Update Central Video Card with 16:9 YouTube Thumbnail**
  - Calculate `thumbnailUrl = userVideo.video.thumbnail_url || (userVideo.video.youtube_id ? 'https://img.youtube.com/vi/' + userVideo.video.youtube_id + '/hqdefault.jpg' : null)`.
  - Style as a cinematic 16:9 card (`w-[240px] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-lg`).
  - Image element with dark gradient wash at bottom, centered Play badge overlay, video title in bold, and duration pill.

- [ ] **Step 2: Update Node Cards with Thumbnail Preview Header**
  - Each node card includes a top thumbnail banner (height ~56px) showing the video frame thumbnail with dark gradient overlay, category pill, and timestamp badge `formatTime(node.start_seconds)`.
  - Body: Node title and summary in clean typography.

- [ ] **Step 3: Update SVG Lines to Direct Hub-and-Spoke Connections**
  - Draw direct lines from center card `(0, 0)` straight to each active node card `(nodeX, nodeY)` using clean straight lines or gentle curves.
  - Stroke: `#94A3B8`, width: 1.75px. When hovered/selected: `#4F46E5`, width: 2.5px.

- [ ] **Step 4: Wire Camera Flight on Cluster/Node Click**
  - Clicking a chapter cluster card calls `flyTo(groupX, groupY, 1.35)` and opens that group.
  - When in deep focus, dim non-active clusters to `opacity: 0.25`.
  - Wire up `onBackToOverview` callback from `CanvasShell` to collapse expanded group.

- [ ] **Step 5: Verify TypeScript compilation**
  Run: `cd Frontend/youtube; npx tsc --noEmit`
  Expected: PASS with 0 errors.

---

### Task 4: Camera Flight Integration for Blueprint & Concept Map

**Files:**
- Modify: `Frontend/youtube/components/canvas/formats/BlueprintCanvas.tsx`
- Modify: `Frontend/youtube/components/canvas/formats/ConceptMapCanvas.tsx`

- [ ] **Step 1: Wire up camera flight in `BlueprintCanvas.tsx`**
  - Clicking a phase header calls `flyTo(colX + colWidth / 2, -40, 1.25)`.
  - Dim other phases to `opacity: 0.3` during deep focus.

- [ ] **Step 2: Wire up camera flight in `ConceptMapCanvas.tsx`**
  - Clicking a concept card calls `flyTo(pos.x, pos.y, 1.4)`.

- [ ] **Step 3: Verify TypeScript compilation**
  Run: `cd Frontend/youtube; npx tsc --noEmit`
  Expected: PASS with 0 errors.

---

### Task 5: Full Verification & Sanity Checks

**Files:**
- All modified files

- [ ] **Step 1: Run frontend TypeScript check**
  Run: `cd Frontend/youtube; npx tsc --noEmit`
  Expected: 0 errors.

- [ ] **Step 2: Run backend Django system check**
  Run: `cd Backend; uv run python manage.py check`
  Expected: 0 issues.

- [ ] **Step 3: Run backend knowledge format tests**
  Run: `cd Backend; uv run python manage.py test videos.tests.VideoKnowledgeFormatTest`
  Expected: 3/3 tests OK.

