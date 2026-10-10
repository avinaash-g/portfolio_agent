/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        beige: {
          50: '#FAF7F4',
          100: '#F3EFEA', // Primary Application Background
          200: '#EAE4DC', // Hover highlight
          300: '#E5DFD7', // Subtle border divider
          400: '#DCD5CB', // Secondary border divider
        },
        navy: {
          DEFAULT: '#1B1F3B',
          950: '#111427',
          900: '#1B1F3B', // Main headings & bold typography
          800: '#262B4E',
          700: '#343A62',
          muted: 'rgba(27, 31, 59, 0.75)',
          subtle: 'rgba(27, 31, 59, 0.45)',
        },
        grape: {
          DEFAULT: '#6B3074',
          400: '#9B4FA7',
          500: '#843C8F',
          600: '#6B3074', // Brand identity accent
          700: '#5E1B89', // Deeper grape
          800: '#49136D',
        },
        coral: {
          DEFAULT: '#FF6B6B',
          400: '#FF8787',
          500: '#FF6B6B', // Primary CTA button
          600: '#FA5252', // Hover state
          700: '#E03131',
        },
        primary: {
          50: '#fff5f5',
          100: '#ffe3e3',
          200: '#ffc9c9',
          300: '#ffa8a8',
          400: '#ff8787',
          500: '#FF6B6B', // Coral
          600: '#FA5252',
          700: '#e03131',
          800: '#c92a2a',
          900: '#b02525',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(27, 31, 59, 0.05), 0 1px 3px -1px rgba(27, 31, 59, 0.03)',
        'card': '0 4px 16px -4px rgba(27, 31, 59, 0.07), 0 1px 3px 0 rgba(27, 31, 59, 0.04)',
        'coral': '0 8px 20px -4px rgba(255, 107, 107, 0.35)',
        'grape': '0 8px 20px -4px rgba(107, 48, 116, 0.35)',
      }
    },
  },
  plugins: [],
}
