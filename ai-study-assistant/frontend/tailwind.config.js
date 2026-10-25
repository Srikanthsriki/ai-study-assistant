/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe6fe',
          200: '#bfd3fe',
          300: '#93b3fd',
          400: '#6089fa',
          500: '#3c66f5',
          600: '#2749e9',
          700: '#2039d3',
          800: '#2131aa',
          900: '#202e86',
        },
        accent: {
          400: '#22d3ee',
          500: '#06b6d4',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      boxShadow: {
        soft: '0 4px 20px -4px rgba(15, 23, 42, 0.08)',
        softDark: '0 4px 20px -4px rgba(0, 0, 0, 0.4)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: 0, transform: 'translateY(6px)' }, '100%': { opacity: 1, transform: 'translateY(0)' } },
        pulseDot: { '0%,100%': { opacity: 0.3 }, '50%': { opacity: 1 } },
      },
      animation: {
        fadeIn: 'fadeIn 0.35s ease-out',
        pulseDot: 'pulseDot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
