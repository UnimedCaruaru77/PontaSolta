import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#22d3ee',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        secondary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        accent: {
          yellow: '#fde047',
          orange: '#fb923c',
          red: '#ef4444',
        },
        dark: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
        'glow-red': 'glow-red 1s ease-in-out infinite alternate',
        'glow-orange': 'glow-orange 1s ease-in-out infinite alternate',
        'glow-yellow': 'glow-yellow 2s ease-in-out infinite alternate',
        'glow-high': 'glow-high 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'glow-pulse': {
          '0%': { boxShadow: '0 0 5px rgba(34, 211, 238, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(34, 211, 238, 0.8), 0 0 30px rgba(34, 211, 238, 0.6)' },
        },
        'glow-red': {
          '0%': { boxShadow: '0 0 5px rgba(239, 68, 68, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(239, 68, 68, 0.8), 0 0 30px rgba(239, 68, 68, 0.6)' },
        },
        'glow-orange': {
          '0%': { boxShadow: '0 0 5px rgba(251, 146, 60, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(251, 146, 60, 0.8), 0 0 30px rgba(251, 146, 60, 0.6)' },
        },
        'glow-yellow': {
          '0%': { boxShadow: '0 0 5px rgba(253, 224, 71, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(253, 224, 71, 0.8), 0 0 30px rgba(253, 224, 71, 0.6)' },
        },
        'glow-high': {
          '0%': { boxShadow: '0 0 5px rgba(148, 163, 184, 0.5)' },
          '100%': { boxShadow: '0 0 20px rgba(148, 163, 184, 0.8), 0 0 30px rgba(148, 163, 184, 0.6)' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;