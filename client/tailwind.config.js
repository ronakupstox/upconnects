/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        upstox: {
          purple: '#6C3EFF',
          'purple-light': '#8A66FF',
          'purple-dim': '#3D1FA8',
          dark: '#0D0D1A',
          navy: '#12122A',
          card: '#1A1A3E',
          'card-hover': '#22225A',
          muted: '#6B6B9A',
        },
      },
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      animation: {
        'pop-in': 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'fade-up': 'fadeUp 0.4s ease-out',
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        popIn: {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        fadeUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
