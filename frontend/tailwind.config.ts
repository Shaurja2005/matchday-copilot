/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // World Cup inspired palette
        pitch: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#1a7a2e', // Primary pitch green
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        gold: {
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#D4AF37', // Trophy gold
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
        },
        navy: {
          50: '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d7fe',
          300: '#a5b8fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#1e3a8a',
          700: '#1e3068',
          800: '#0d1b3e', // Deep navy
          900: '#070f22',
          950: '#030612',
        },
        // Status colors
        crowd: {
          normal: '#22c55e',
          busy: '#f59e0b',
          critical: '#ef4444',
        },
      },
      fontFamily: {
        headline: ['Anton', 'Impact', 'sans-serif'],
        display: ['Oswald', 'Anton', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'pitch-pattern': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60'%3E%3Crect width='60' height='30' fill='%231a7a2e' opacity='0.3'/%3E%3Crect y='30' width='60' height='30' fill='%231a7a2e' opacity='0.2'/%3E%3C/svg%3E\")",
        'hero-gradient': 'linear-gradient(135deg, #070f22 0%, #0d1b3e 50%, #14532d 100%)',
        'card-gradient': 'linear-gradient(135deg, rgba(13,27,62,0.9) 0%, rgba(26,122,46,0.3) 100%)',
        'gold-gradient': 'linear-gradient(135deg, #D4AF37, #facc15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.4s ease-out',
        'bounce-gentle': 'bounceGentle 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        bounceGentle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'gold': '0 0 20px rgba(212, 175, 55, 0.4)',
        'gold-lg': '0 0 40px rgba(212, 175, 55, 0.3)',
        'pitch': '0 0 20px rgba(26, 122, 46, 0.4)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
