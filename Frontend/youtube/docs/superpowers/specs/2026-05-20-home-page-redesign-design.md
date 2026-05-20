# YouTube Cutter Home Page Redesign Design Document

**Date**: 2026-05-20  
**Status**: Approved  

## Purpose

Redesign the YouTube cutter home page to match the visual design shown in `Images\\Body (1).png` with a white background instead of the current dark/off-white background.

## Constraints & Success Criteria

- Must replicate the overall layout, color scheme, typography, and spacing from the reference image
- Background must be pure white (#FFFFFF) consistently (not the current light mode #F1EFE8 or dark mode #141412)
- Use Tailwind utility classes directly in JSX rather than modifying CSS variables
- Maintain all existing functionality and component structure
- Design should be responsive and work across different screen sizes

## Design Approach

### Selected Approach: Use Tailwind utility classes directly in JSX

We will modify the home page components (`HomeHero`, `HomeStats`, `HomeFeatures`, `HomeHowItWorks`, `HomeCTA`) to use Tailwind utility classes directly in their JSX to match the reference design, while setting the background to pure white.

### Architecture & Component Structure

The home page maintains its existing structure:
- `LandingLayout` provides the outer shell with header and footer
- Page content consists of these sections in order:
  1. HomeHero
  2. HomeStats  
  3. HomeFeatures
  4. HomeHowItWorks
  5. HomeCTA

### Styling Changes by Component

#### LandingLayout
Change background from `bg-[var(--color-bg-tertiary)]` to `bg-white` to achieve pure white background.

#### HomeHero
- Update background to white
- Adjust text colors to match reference design (likely darker text on white background)
- Modify form/input styling to match reference
- Update button styles to match reference design
- Adjust spacing and typography to match reference

#### HomeStats
- Update border colors to match reference
- Adjust text colors for values and labels
- Modify background if needed (likely keep white or very light gray)
- Update spacing and typography

#### HomeFeatures
- Update card backgrounds and borders
- Adjust icon background colors to match reference
- Modify text colors for titles and descriptions
- Update hover effects to match reference
- Adjust spacing and typography

#### HomeHowItWorks
- Update step indicator colors to match reference
- Adjust text colors for titles and descriptions
- Modify spacing and typography

#### HomeCTA
- Update background and border colors
- Adjust text and button colors
- Update spacing and typography

### Data Flow & Interactions

No changes to data flow or interactions - only visual/styling updates:
- Form submission in HomeHero remains unchanged
- Navigation links in HomeNav remain unchanged
- All component props and state remain unchanged

### Error Handling

No changes to error handling - purely visual updates.

### Testing Approach

Visual verification against the reference image `Images\\Body (1).png`:
- Manual inspection to ensure layout matches
- Responsive testing across different screen sizes
- Light/dark mode verification (should now show white background in both modes)
- Component interaction testing to ensure functionality remains intact

## Open Questions & Decisions

None - approach has been approved.

## Related Files

- `src/pages/index.tsx` - Home page composition
- `src/components/layout/LandingLayout.tsx` - Outer layout (background change)
- `src/components/home/HomeHero.tsx` - Main hero section
- `src/components/home/HomeStats.tsx` - Statistics section
- `src/components/home/HomeFeatures.tsx` - Features grid
- `src/components/home/HomeHowItWorks.tsx` - How it works section
- `src/components/home/HomeCTA.tsx` - Call to action section
- `src/components/home/HomeNav.tsx` - Navigation (minor color adjustments if needed)
- `src/components/home/HomeFooter.tsx` - Footer (minor color adjustments if needed)

---
*Design approved and ready for implementation planning.*