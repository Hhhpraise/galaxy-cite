/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cosmic: {
          50: '#f0f5ff',
          100: '#e5edff',
          200: '#cddbfe',
          300: '#b4c6fc',
          400: '#8da2fb',
          500: '#6875f5',
          600: '#5850ec',
          700: '#5145cd',
          800: '#42389d',
          900: '#362f78',
        },
        nebula: {
          pink: '#ff6bcb',
          purple: '#8a2be2',
          blue: '#4361ee',
          cyan: '#00d4ff',
          dark: '#0f172a',
        }
      },
      backgroundImage: {
        'cosmic-gradient': 'radial-gradient(ellipse at top, #0f172a, #1e1b4b)',
        'nebula-gradient': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'stars': "url('data:image/svg+xml,%3Csvg xmlns=\"http://www.w3.org/2000/svg\" width=\"100\" height=\"100\" viewBox=\"0 0 100 100\"%3E%3Ccircle cx=\"20\" cy=\"20\" r=\"1\" fill=\"white\" opacity=\"0.5\"/%3E%3Ccircle cx=\"50\" cy=\"80\" r=\"1.5\" fill=\"white\" opacity=\"0.7\"/%3E%3Ccircle cx=\"80\" cy=\"40\" r=\"1\" fill=\"white\" opacity=\"0.5\"/%3E%3Ccircle cx=\"30\" cy=\"60\" r=\"0.8\" fill=\"white\" opacity=\"0.4\"/%3E%3C/svg%3E')",
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'orbit': 'orbit 20s linear infinite',
      },
      fontFamily: {
        'space': ['Space Grotesk', 'monospace'],
      }
    },
  },
  plugins: [],
}