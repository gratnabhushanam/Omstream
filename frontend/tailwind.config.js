/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
        screens: {
          'xs': '320px',   // iPhone SE
          'sm': '640px',   // Mobile landscape / Tablet portrait
          'md': '768px',   // Tablet landscape
          'lg': '1024px',  // Desktop
          'xl': '1280px',  // Large desktop
          '2xl': '1536px', // Extra large desktop
          'tv': '1920px',  // Smart TV / 4K displays
        },
    extend: {
      colors: {
        devotion: {
          bgYellow: '#FFB703',
          gold: '#FF9F1C',
          maroon: '#2D0F0F',
          darkMaroon: '#1A0909',
          textYellow: '#FFECD1',
          crimson: '#8B0000',
          darkBlue: '#15151B',
        },
        spiritual: {
          darkNavyStart: '#111116',
          darkNavyEnd: '#09090C',
          gold: '#FF9F1C',
          goldLight: '#F59E0B',
          cardBg: '#15151B',
          inputBg: '#1C1C24',
          textLight: '#f3f4f6',
          textMuted: '#9ca3af',
        }
      },
      fontFamily: {
        sans: ['Poppins', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        telugu: ['Ramabhadra', 'sans-serif'],
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
        'gold-glow': 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, rgba(21,21,27,0) 70%)',
        'spiritual-gradient': 'linear-gradient(135deg, #111116 0%, #09090C 100%)',
        'spiritual-card-glow': 'radial-gradient(circle at center, rgba(249, 115, 22, 0.1) 0%, rgba(21, 21, 27, 0) 70%)',
      },
      boxShadow: {
        'spiritual-glow': '0 0 40px rgba(249, 115, 22, 0.15), 0 0 80px rgba(249, 115, 22, 0.08)',
        'spiritual-glow-heavy': '0 0 60px rgba(249, 115, 22, 0.2), 0 0 120px rgba(249, 115, 22, 0.1)',
      },
      animation: {
        'fade-in-up': 'fadeInUp 0.8s ease-out forwards',
        'fade-in-down': 'fadeInDown 0.8s ease-out forwards',
        'float': 'float 6s ease-in-out infinite',
        'shake': 'shake 0.5s cubic-bezier(.36,.07,.19,.97) both',
        'pulse-glow': 'pulseGlow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite',
        'gentle-float': 'gentleFloat 4s ease-in-out infinite',
      },
      keyframes: {
        shake: {
          '10%, 90%': { transform: 'translate3d(-1px, 0, 0)' },
          '20%, 80%': { transform: 'translate3d(2px, 0, 0)' },
          '30%, 50%, 70%': { transform: 'translate3d(-4px, 0, 0)' },
          '40%, 60%': { transform: 'translate3d(4px, 0, 0)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        gentleFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
}
