/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        brand: {
          DEFAULT: '#00D4FF',
          dim: '#00A8CC',
          muted: 'rgba(0,212,255,0.1)',
          border: 'rgba(0,212,255,0.2)',
        },
        surface: {
          base: '#0A0C10',
          raised: '#0F1117',
          overlay: '#161B22',
          border: '#21262D',
          hover: '#1C2128',
        },
        success: { DEFAULT: '#3FB950', muted: 'rgba(63,185,80,0.12)' },
        warning: { DEFAULT: '#D29922', muted: 'rgba(210,153,34,0.12)' },
        danger:  { DEFAULT: '#F85149', muted: 'rgba(248,81,73,0.12)'  },
        info:    { DEFAULT: '#58A6FF', muted: 'rgba(88,166,255,0.12)' },
        text: {
          primary:   '#E6EDF3',
          secondary: '#8B949E',
          muted:     '#484F58',
          inverse:   '#0A0C10',
        },
      },
      fontFamily: {
        sans:    ["'DM Sans'", 'sans-serif'],
        mono:    ["'JetBrains Mono'", 'monospace'],
        display: ["'Syne'", 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        glow:         '0 0 20px rgba(0,212,255,0.15)',
        'glow-lg':    '0 0 40px rgba(0,212,255,0.2)',
        card:         '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.5)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.5)',
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'fade-in':        { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        'slide-in':       { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
        shimmer:          { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        'spin-slow':      { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-in':        'fade-in 0.4s ease-out',
        'slide-in':       'slide-in 0.3s ease-out',
        shimmer:          'shimmer 2s infinite linear',
        'spin-slow':      'spin-slow 3s linear infinite',
      },
      backgroundImage: {
        'grid-pattern':   'linear-gradient(rgba(33,38,45,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(33,38,45,0.5) 1px, transparent 1px)',
        'brand-gradient': 'linear-gradient(135deg, #00D4FF 0%, #0080FF 100%)',
        shimmer:          'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
      },
      backgroundSize: {
        grid: '24px 24px',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

module.exports = config;
