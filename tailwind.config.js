/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          'light': '#007AFF',
          'dark': '#0A84FF'
        },
        secondary: {
          'light': '#8E8E93',
          'dark': '#8E8E93'
        },
        accent: {
          'light': '#FF3B30',
          'dark': '#FF453A'
        },
        background: {
          'light': '#F2F2F7',
          'dark': '#000000'
        },
        text: {
          'light': '#000000',
          'dark': '#FFFFFF'
        },
        glass: {
          'light': 'rgba(242, 242, 247, 0.8)',
          'dark': 'rgba(28, 28, 30, 0.8)'
        },
        ring: {
          'light': 'rgba(0, 122, 255, 0.5)',
          'dark': 'rgba(10, 132, 255, 0.5)'
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
      },
      fontSize: {
        'large-title': '2.125rem',
        'title1': '1.75rem',
        'title2': '1.375rem',
        'title3': '1.25rem',
        'headline': '1.0625rem',
        'body': '1.0625rem',
        'callout': '1rem',
        'subhead': '0.9375rem',
        'footnote': '0.8125rem',
        'caption1': '0.75rem',
        'caption2': '0.6875rem',
      },
      spacing: {
        '18': '4.5rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      backdropBlur: {
        'xl': '24px',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'subtle-bounce': 'subtleBounce 1s ease-in-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        subtleBounce: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-5px)' },
        }
      },
    },
  },
  plugins: [],
} 