// ============================================================
// VidMind AI — Tailwind CSS Configuration
// tailwind.config.ts
//
// This config extends Tailwind's defaults with VidMind's
// design tokens, making every token available as a Tailwind
// utility class (e.g. bg-primary-600, text-neutral-400).
//
// Rule: Never hardcode colours in components.
//       Always use tokens via this config or variables.css.
// ============================================================

import type { Config } from 'tailwindcss'

const config: Config = {
  // ----------------------------------------------------------
  // CONTENT PATHS
  // Tell Tailwind which files to scan for class names.
  // ----------------------------------------------------------
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],

  // ----------------------------------------------------------
  // DARK MODE
  // 'media' — follows OS preference (matches our CSS strategy)
  // ----------------------------------------------------------
  darkMode: 'media',

  theme: {
    extend: {

      // --------------------------------------------------------
      // FONT FAMILIES
      // --------------------------------------------------------
      fontFamily: {
        sans: ['DM Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Courier New', 'monospace'],
      },

      // --------------------------------------------------------
      // FONT SIZES
      // Each entry: [fontSize, { lineHeight, letterSpacing, fontWeight }]
      // --------------------------------------------------------
      fontSize: {
        'display-lg': ['36px', { lineHeight: '1.2',  letterSpacing: '-0.02em',   fontWeight: '500' }],
        'display-md': ['28px', { lineHeight: '1.25', letterSpacing: '-0.015em',  fontWeight: '500' }],
        'heading-xl': ['22px', { lineHeight: '1.3',  letterSpacing: '-0.01em',   fontWeight: '500' }],
        'heading-lg': ['18px', { lineHeight: '1.35', letterSpacing: '-0.005em',  fontWeight: '500' }],
        'heading-md': ['16px', { lineHeight: '1.4',  letterSpacing: '0em',       fontWeight: '500' }],
        'heading-sm': ['14px', { lineHeight: '1.4',  letterSpacing: '0em',       fontWeight: '500' }],
        'body-lg':    ['16px', { lineHeight: '1.7',  letterSpacing: '0em',       fontWeight: '400' }],
        'body-md':    ['14px', { lineHeight: '1.6',  letterSpacing: '0em',       fontWeight: '400' }],
        'body-sm':    ['13px', { lineHeight: '1.55', letterSpacing: '0em',       fontWeight: '400' }],
        'caption':    ['12px', { lineHeight: '1.5',  letterSpacing: '0.01em',    fontWeight: '400' }],
        'label':      ['11px', { lineHeight: '1.4',  letterSpacing: '0.04em',    fontWeight: '500' }],
        'code':       ['13px', { lineHeight: '1.6',  letterSpacing: '0em',       fontWeight: '400' }],
      },

      // --------------------------------------------------------
      // FONT WEIGHTS
      // Only 400 and 500 — never use 600 or 700 in this project.
      // --------------------------------------------------------
      fontWeight: {
        normal: '400',
        medium: '500',
      },

      // --------------------------------------------------------
      // COLOURS
      // Maps every design token to a Tailwind colour.
      // Usage: bg-primary-600, text-neutral-400, etc.
      // --------------------------------------------------------
      colors: {

        // Primary Blue
        primary: {
          '50':  '#E6F1FB',
          '100': '#B5D4F4',
          '200': '#85B7EB',
          '400': '#378ADD',
          '600': '#185FA5',
          '800': '#0C447C',
          '900': '#042C53',
        },

        // Neutral Grey
        neutral: {
          '50':  '#F1EFE8',
          '100': '#D3D1C7',
          '200': '#B4B2A9',
          '400': '#888780',
          '600': '#5F5E5A',
          '800': '#444441',
          '900': '#2C2C2A',
        },

        // Semantic — Success Green
        success: {
          '50':  '#EAF3DE',
          '200': '#97C459',
          '600': '#3B6D11',
          '800': '#27500A',
        },

        // Semantic — Warning Amber
        warning: {
          '50':  '#FAEEDA',
          '200': '#EF9F27',
          '600': '#854F0B',
          '800': '#633806',
        },

        // Semantic — Danger Red
        danger: {
          '50':  '#FCEBEB',
          '200': '#F09595',
          '600': '#A32D2D',
          '800': '#791F1F',
        },

        // Premium Purple
        premium: {
          '50':  '#EEEDFE',
          '200': '#AFA9EC',
          '600': '#534AB7',
          '800': '#3C3489',
        },

        // Surface colours — reference variables.css for full dark mode set
        surface: {
          primary:   'var(--color-bg-primary)',
          secondary: 'var(--color-bg-secondary)',
          tertiary:  'var(--color-bg-tertiary)',
        },
      },

      // --------------------------------------------------------
      // SPACING
      // Extends Tailwind's default scale — don't replace it.
      // --------------------------------------------------------
      spacing: {
        '0.5': '2px',
        '4.5': '18px',
        '13':  '52px',
        '15':  '60px',
        '18':  '72px',
        '22':  '88px',
        '26':  '104px',
        '30':  '120px',
      },

      // --------------------------------------------------------
      // BORDER RADIUS
      // --------------------------------------------------------
      borderRadius: {
        'sm':   '4px',
        'md':   '8px',
        'lg':   '12px',
        'xl':   '16px',
        '2xl':  '20px',
        'full': '9999px',
      },

      // --------------------------------------------------------
      // BORDER WIDTH
      // --------------------------------------------------------
      borderWidth: {
        DEFAULT: '0.5px',
        '0':     '0px',
        '1':     '1px',
        '2':     '2px',
      },

      // --------------------------------------------------------
      // MAX WIDTH
      // --------------------------------------------------------
      maxWidth: {
        'narrow':   '420px',
        'text':     '680px',
        'content':  '1200px',
      },

      // --------------------------------------------------------
      // WIDTH / HEIGHT FIXED VALUES
      // Used for fixed layout elements.
      // --------------------------------------------------------
      width: {
        'sidebar':       '200px',
        'sidebar-sm':    '56px',
        'right-panel':   '260px',
        'settings-nav':  '180px',
      },

      height: {
        'topbar':       '52px',
        'bottom-nav':   '56px',
      },

      // --------------------------------------------------------
      // Z-INDEX
      // --------------------------------------------------------
      zIndex: {
        'below':    '-1',
        'base':     '0',
        'raised':   '10',
        'dropdown': '100',
        'sticky':   '200',
        'overlay':  '300',
        'modal':    '400',
        'toast':    '500',
        'tooltip':  '600',
      },

      // --------------------------------------------------------
      // TRANSITION TIMING
      // --------------------------------------------------------
      transitionDuration: {
        'fast':  '100ms',
        'base':  '200ms',
        'slow':  '300ms',
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },

      // --------------------------------------------------------
      // KEYFRAME ANIMATIONS
      // Names map to keyframes defined in index.css.
      // --------------------------------------------------------
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'spin': {
          from: { transform: 'rotate(0deg)' },
          to:   { transform: 'rotate(360deg)' },
        },
        'skeleton-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        'ping': {
          '75%, 100%': { transform: 'scale(2)', opacity: '0' },
        },
      },

      animation: {
        'fade-in':        'fade-in 200ms ease-out',
        'slide-up':       'slide-up 200ms ease-out',
        'slide-in-right': 'slide-in-right 250ms ease-out',
        'spin':           'spin 800ms linear infinite',
        'skeleton':       'skeleton-pulse 1.5s ease-in-out infinite',
        'ping':           'ping 1s cubic-bezier(0,0,.2,1) infinite',
      },

      // --------------------------------------------------------
      // SCREENS (breakpoints)
      // --------------------------------------------------------
      screens: {
        'mobile':  { max: '767px' },
        'tablet':  { min: '768px',  max: '1023px' },
        'desktop': { min: '1024px', max: '1279px' },
        'wide':    { min: '1280px' },
        // Standard min-width overrides (Tailwind defaults are kept):
        'sm':      '640px',
        'md':      '768px',
        'lg':      '1024px',
        'xl':      '1280px',
        '2xl':     '1536px',
      },

      // --------------------------------------------------------
      // BOX SHADOW
      // Flat design — shadows are functional only.
      // --------------------------------------------------------
      boxShadow: {
        none:  'none',
        focus: '0 0 0 3px rgba(55, 138, 221, 0.20)',
      },
    },
  },

  // ----------------------------------------------------------
  // PLUGINS
  // ----------------------------------------------------------
  plugins: [],
}

export default config
