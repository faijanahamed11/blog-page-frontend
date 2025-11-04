/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Original color scheme from vanilla CSS
        'original': {
          'bg': '#F8D0B3',      // Warm beige/peach background
          'primary': '#5D1F5E',  // Deep purple/brown text
          'accent': '#FF6F61',   // Coral/salmon accent (not orange!)
          'secondary': '#D1A6D4', // Light lavender
        }
      },
      animation: {
        'fadeIn': 'fadeIn 0.2s ease-out',
        'slideIn': 'slideIn 0.3s ease-out',
        'slideDown': 'slideDown 0.3s ease-out',
        'pulse': 'pulse 2s infinite',
        'bounce': 'bounce 2s infinite',
        'shimmer': 'shimmer 3s infinite',
      },
      keyframes: {
        fadeIn: {
          'from': { opacity: '0' },
          'to': { opacity: '1' },
        },
        slideIn: {
          'from': {
            opacity: '0',
            transform: 'scale(0.95) translateY(-10px)'
          },
          'to': {
            opacity: '1',
            transform: 'scale(1) translateY(0)'
          },
        },
        slideDown: {
          'from': {
            opacity: '0',
            transform: 'translateY(-10px)'
          },
          'to': {
            opacity: '1',
            transform: 'translateY(0)'
          },
        },
        shimmer: {
          '0%': { left: '-100%' },
          '100%': { left: '100%' },
        },
      },
      spacing: {
        '12.5': '3.125rem', // 50px
        '25': '6.25rem',    // 100px
        '30': '7.5rem',     // 120px
        '50': '12.5rem',    // 200px
        '75': '18.75rem',   // 300px
        '90': '22.5rem',    // 360px
      },
      minWidth: {
        '30': '7.5rem',     // 120px
        '50': '12.5rem',    // 200px
      },
      minHeight: {
        '25': '6.25rem',    // 100px
      },
      transitionProperty: {
        'right': 'right',
      },
    },
  },
  plugins: [],
}
