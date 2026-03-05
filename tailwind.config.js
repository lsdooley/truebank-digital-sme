/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        'bg-primary': '#0A0F1E',
        'bg-secondary': '#0F172A',
        'bg-card': '#1E293B',
        'bg-elevated': '#263248',
        'border-default': '#2D3D5A',
        'border-subtle': '#1E2D45',
        'accent-blue': '#2563EB',
        'accent-blue-lt': '#3B82F6',
        'accent-teal': '#0D9488',
        'accent-amber': '#D97706',
        'accent-green': '#16A34A',
        'accent-red': '#DC2626',
        'text-primary': '#E2E8F0',
        'text-secondary': '#94A3B8',
        'text-muted': '#64748B',
        'text-code': '#7DD3FC',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'blink': 'blink 1s step-end infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};
