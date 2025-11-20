import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx,js,jsx}', './components/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        'bh-bg': '#0b0b10',
        'bh-panel': '#141421',
        'bh-card': '#1c1c2a',
        'bh-text': '#e0e0e0',
        'bh-muted': '#9ca3af',
        'bh-red': '#ff4d4d',
        'bh-green': '#2ecc71',
        'bh-blue': '#4da6ff',
      },
      fontFamily: {
        inter: ['Inter', 'var(--font-sans)', 'sans-serif'],
      },
      borderRadius: {
        'bh-xl': '1.5rem',
        'bh-card': '1.25rem',
      },
      boxShadow: {
        'bh-glow': '0 30px 120px rgba(0, 0, 0, 0.55)',
        'bh-inner': 'inset 0 10px 35px rgba(0, 0, 0, 0.35)',
      },
    },
  },
  plugins: [],
}

export default config
