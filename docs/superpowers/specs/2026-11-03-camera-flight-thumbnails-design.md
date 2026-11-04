# Design Specification: Camera Flight Animation, Direct Hub Lines & Thumbnail Integration

## 1. Intent & The Why

When a YouTube video contains 10+ knowledge nodes, presenting everything at once causes cognitive overload. The user desires a fluid, map-like zoom exploration experience:
1. **Collapsed by Default:** When nodes > 10, all groups start collapsed, presenting a clean high-level constellation.
2. **Camera Flight Motion:** Clicking any group node triggers a smooth camera fly-and-zoom animation (`cubic-bezier(0.16, 1, 0.3, 1)`) that frames that group's child nodes in the viewport.
3. **Back to Overview:** A prominent `← Back to Overview` glass button smoothly returns the camera to the full canvas bird's-eye view.
4. **Direct Hub-and-Spoke Lines:** In the Mindmap, eliminate confusing intermediate tree branch tendrils. Instead, clean lines radiate **directly from the central video title** to every node.
5. **Rich Media / Thumbnail Integration:**
   - The central video node displays the actual 16:9 YouTube video thumbnail with gradient overlay, duration pill, and title.
   - Each node card includes a thumbnail preview header with an embedded timestamp pill (`MM:SS`), giving visual context from the video.

---

## 2. Goals, Non-Goals & Anti-Goals

### Goals
- **Smooth Programmatic Camera Glide:** `CanvasShell` smoothly interpolates `(pan.x, pan.y, zoom)` to target coordinates without jarring jumps.
- **Back to Overview Navigation:** Floating breadcrumb button to reset camera and collapse expanded focus.
- **Direct Mindmap Spoke Connections:** Crisp SVG paths radiating directly from the center thumbnail card to each node.
- **Card Media Assets:** High-contrast 16:9 YouTube thumbnail on the center card, and contextual thumbnail banners on node cards.
- **Default Collapsed when >10 Nodes:** `useGroupedNodes` initializes with groups collapsed if `nodes.length > 10`.

### Non-Goals
- Full 3D WebGL camera (standard 2D CSS GPU-accelerated matrix transforms are faster, lighter, and universally responsive).
- Modifying backend database models (thumbnails already exist in `userVideo.video.thumbnail_url` and YouTube ID).

### Anti-Goals
- Sluggish or laggy camera pans that drop frames.
- Tiny or pixelated thumbnails.
- Obscuring connecting lines behind cards.

---

## 3. Approaches Considered & Selected

### Approach A: Cinematic Camera Flight & Direct Hub-Spoke (Selected)
- **Camera:** Programmatic camera animator in `CanvasShell` with `animateCameraTo({ x, y, zoom, duration })`. Dim non-focused nodes (`opacity: 0.25`) during deep focus.
- **Topology:** Direct hub-and-spoke lines from center node to all items.
- **Thumbnails:** 16:9 thumbnail on central video node + micro-thumbnail headers on node cards.
- **Why Selected:** Delivers the exact fluid map-app fly-through requested by the user.

### Approach B: In-Place Card Expansion with Panning Only (Rejected)
- Panned without changing zoom levels.
- Why Rejected: Lacks the dynamic deep-dive feeling; dense nodes feel cramped without zooming in.

---

## 4. Technical Architecture & Implementation Details

### 4.1 Camera Flight Engine (`CanvasShell.tsx`)
Add a camera transition controller:
```typescript
interface CameraTarget {
  x: number
  y: number
  zoom: number
  duration?: number // default 550ms
}
```
- Smooth interpolation using CSS transition `transition: transform 550ms cubic-bezier(0.16, 1, 0.3, 1)` during programmatic flight, switched back to `duration-75` or instant during manual drag/pinch.
- Expose `flyTo(targetX, targetY, zoom)` and `resetCamera()` via a render prop or canvas ref.
- Floating `← Back to Overview` glass button:
  - Position: top center (`absolute top-5 left-1/2 -translate-x-1/2 z-30`).
  - Style: `bg-white/95 border border-slate-200/90 text-slate-800 shadow-xl backdrop-blur-md px-4 py-2 rounded-full`.
  - Visible whenever a group or node is currently in deep focus.

### 4.2 Mindmap Hub-and-Spoke Topology (`MindmapCanvas.tsx`)
- **Center Node:**
  - Dimensions: `w-[240px] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-lg`.
  - Image: 16:9 video thumbnail (`userVideo.video.thumbnail_url || 'https://img.youtube.com/vi/${youtube_id}/hqdefault.jpg'`) with subtle dark gradient vignette.
  - Content: Play badge overlay, video title, and duration pill (`Clock` icon + `42 min`).
- **Direct Connecting Lines:**
  - Radial or circular distribution around center `(0, 0)`.
  - Lines originate at `(0, 0)` (or edge of center card) and connect directly to each node card `(nodeX, nodeY)`.
  - Stroke: `#94A3B8` (slate-400), width 1.75px. When focused/hovered: `#4F46E5` (indigo-600), width 2.5px.
- **Node Cards with Thumbnails:**
  - Header: Video thumbnail slice with dark gradient and timestamp pill (`formatTime(node.start_seconds)`).
  - Body: Node type badge (`claim`, `stat`, `step`, etc.) + bold title + summary.

### 4.3 Default Collapsing Logic (`useGroupedNodes.ts`)
- Automatically initialize `expandedGroups` as empty `Set()` whenever `totalNodesCount > 10`.
- Only auto-expand if `totalNodesCount <= 10`.

---

## 5. Verification & Testing Plan
1. **TypeScript Typecheck:** `npx tsc --noEmit` must pass with 0 errors.
2. **Camera Smoothness Test:** Click a group node $\rightarrow$ camera glides to cluster. Click `← Back to Overview` $\rightarrow$ glides back to `(0, 0)`.
3. **Thumbnail Rendering:** Verify video thumbnail renders crisply on central card and on node cards.
4. **Direct Lines:** Confirm lines originate cleanly from central card and connect directly to nodes without intersecting text.

