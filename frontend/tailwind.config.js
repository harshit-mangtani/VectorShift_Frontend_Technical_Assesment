/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    screens: {
      xs: '420px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
    extend: {
      colors: {
        ink: '#1B1E2B',
        muted: '#71768A',
        line: '#E7E9F2',
        canvas: '#F4F5FB',
        brand: { DEFAULT: '#6366F1', hover: '#5457E5', soft: '#EEF0FE' },
      },
      boxShadow: {
        glass: '0 8px 32px -8px rgba(28,33,63,0.14), 0 2px 8px -2px rgba(28,33,63,0.06)',
        card: '0 1px 2px rgba(28,33,63,.05), 0 4px 16px -6px rgba(28,33,63,.10)',
        lift: '0 12px 32px -10px rgba(28,33,63,.22), 0 4px 10px -4px rgba(28,33,63,.10)',
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      keyframes: {
        dot: {
          '0%, 80%, 100%': { transform: 'translateY(0)', opacity: '.45' },
          '40%': { transform: 'translateY(-4px)', opacity: '1' },
        },
        floatIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'none' },
        },
        popIn: {
          from: { opacity: '0', transform: 'scale(.96)' },
          to: { opacity: '1', transform: 'none' },
        },
        // The bin's reaction as a deleted node lands in it.
      },
      animation: {
        dot: 'dot 1.1s infinite ease-in-out',
        floatIn: 'floatIn .28s ease-out both',
        popIn: 'popIn .18s ease-out both',
      },
    },
  },
  plugins: [],
};
