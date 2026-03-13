import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        slate: {
          950: '#0B0F14'
        }
      },
      boxShadow: {
        glow: '0 0 25px rgba(255, 255, 255, 0.08)'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease forwards'
      }
    }
  },
  plugins: []
} satisfies Config
