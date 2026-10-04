/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // BESIDE warm cocoa palette
        cocoa: {
          50:  '#fdf8f4',
          100: '#f9edd8',
          200: '#f0d4a8',
          300: '#e4b47a',
          400: '#d48f4d',
          500: '#c27030',
          600: '#a85724',
          700: '#8a3f1c',
          800: '#6e2e17',
          900: '#4a1e10',
        },
        chestnut: {
          DEFAULT: '#8B4513',
          light: '#A0522D',
          dark: '#6B3410',
        },
        caramel: {
          DEFAULT: '#C68642',
          light: '#D4A055',
          dark: '#A06C2E',
        },
        cream: {
          DEFAULT: '#FDF6EC',
          dark: '#F5E8D0',
        },
        tan: {
          DEFAULT: '#D2B48C',
          light: '#E8D5B5',
        },
        beside: {
          primary: '#6B3410',    // deep cocoa
          secondary: '#C68642',  // caramel
          accent: '#E07020',     // warm orange
          bg: '#FDF6EC',         // cream
          card: '#FFFFFF',
          muted: '#9B7B5A',
          text: '#2C1810',
          textLight: '#6B5040',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'warm': '0 4px 24px rgba(107, 52, 16, 0.12)',
        'warm-lg': '0 8px 40px rgba(107, 52, 16, 0.18)',
        'card': '0 2px 12px rgba(107, 52, 16, 0.08)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'pulse-warm': 'pulse-warm 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.3s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'bounce-soft': 'bounce-soft 0.6s ease-in-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'pulse-warm': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'bounce-soft': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
      },
    },
  },
  plugins: [],
}
