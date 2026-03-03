import type { Config } from 'tailwindcss'
// eslint-disable-next-line @typescript-eslint/no-require-imports
const defaultColors = require('tailwindcss/colors')

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  // Class-based dark mode — toggled by adding/removing `dark` on <html>
  darkMode: 'class',

  theme: {
    colors: {
      ...defaultColors,

      // ── Warm Archive palette ──────────────────────────────────────────
      // Sepia-brown scale used for both light and dark surfaces.
      // Light mode uses the lighter end (50–200); dark mode the darker end (800–950).
      zinc: {
        950: '#0c0907',  // near-black warm brown
        900: '#171108',  // dark warm brown
        800: '#261e12',  // raised dark surface
        700: '#3d3120',  // dark borders
        600: '#5e4c32',  // muted dark text / scrollbar
        500: '#7a6448',  // mid tone
        400: '#9e8260',  // secondary light text
        300: '#c4a47a',  // light borders
        200: '#d9c09e',  // lighter borders
        100: '#f0e4cc',  // light surface
        50:  '#faf5ee',  // warm cream (light body bg)
      },
    },

    extend: {
      fontFamily: {
        sans:  ['var(--font-inter)',      'system-ui', 'sans-serif'],
        serif: ['var(--font-cormorant)', 'Georgia',    'serif'],
      },

      animation: {
        'fade-in':  'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' },                                    '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' },     '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.96)' },          '100%': { opacity: '1', transform: 'scale(1)' } },
        loading: { '0%': { transform: 'translateX(-100%)' },                  '100%': { transform: 'translateX(350%)' } },
      },
    },
  },
  plugins: [],
}

export default config
