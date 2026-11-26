module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      colors: {
        blue: {
          light: '#85d7ff',
          DEFAULT: '#1fb6ff',
          dark: '#009eeb',
        },
        yellow: {
          light: '#fffbcc',
          DEFAULT: '#ffeb3b',
          dark: '#fbc02d',
        },
        white: '#ffffff',
        gray: {
          light: '#f5f5f5',
          DEFAULT: '#9e9e9e',
          dark: '#616161',
        },
      },
    },
  },
  plugins: [],
};