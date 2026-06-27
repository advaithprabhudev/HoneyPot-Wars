/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'pixel-sky': '#4FA3E0',
        defender: '#2FB89A',
        'defender-green': '#3DA838',
        threat: '#E23B3B',
        coin: '#F4D43C',
        gold: '#F2C12E',
        panel: '#0E0F12',
        row: '#16181D',
        'frame-gold': '#F5B800',
        'frame-teal': '#5FD4C4',
      },
      fontFamily: {
        display: ['"Press Start 2P"', 'monospace'],
        body: ['"VT323"', 'monospace'],
      },
    },
  },
  plugins: [],
};
