/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#0F0F0F',
          card: '#1A1A1A',
          elevated: '#2A2A2A',
        },
        gold: {
          DEFAULT: '#D4AF37',
          hover: '#B8960C',
          light: '#F5E27A',
        },
        text: {
          primary: '#F5F5F5',
          secondary: '#A0A0A0',
          muted: '#6B7280',
        },
        success: '#16A34A',
        danger: '#DC2626',
      },
      borderColor: {
        gold: 'rgba(212, 175, 55, 0.2)',
        light: 'rgba(245, 245, 245, 0.1)',
      },
      boxShadow: {
        'gold-sm': '0 2px 8px rgba(212, 175, 55, 0.08)',
        'gold-md': '0 4px 20px rgba(212, 175, 55, 0.15)',
        'glow': '0 0 12px rgba(212, 175, 55, 0.25)',
        'glow-danger': '0 0 12px rgba(220, 38, 38, 0.25)',
      },
      fontFamily: {
        serif: ['Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
