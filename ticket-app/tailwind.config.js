/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        night: {
          900: '#0a0d14',
          800: '#0f1422',
          700: '#151b2b',
        },
        accent: {
          500: '#7c5cff',
          600: '#6948ff',
        },
      },
      boxShadow: {
        glow: '0 0 40px rgba(124, 92, 255, 0.35)',
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(circle at top, rgba(124,92,255,0.35), transparent 55%)',
      },
    },
  },
  plugins: [],
};
