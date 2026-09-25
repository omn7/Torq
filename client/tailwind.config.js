/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: '#0E1013',
        card: '#181B20',
        cardBorder: '#242930',
        torqGreen: '#30E07D',
        textMuted: '#8E95A2',
        textPrimary: '#FFFFFF',
      },
      borderRadius: {
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
