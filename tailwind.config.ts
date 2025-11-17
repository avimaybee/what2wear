import type { Config } from "tailwindcss";

const config: Config = {
  // Tailwind v4 uses automatic content detection by default
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        heading: ['Belleza', 'sans-serif'],
        body: ['Fredoka', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
      },
      boxShadow: {
        'papercraft': '0 4px 8px -2px rgba(120, 80, 40, 0.10), 0 6px 12px -2px rgba(120, 80, 40, 0.14)',
        'papercraft-lg': '0 6px 10px -2px rgba(120, 80, 40, 0.12), 0 12px 20px -4px rgba(120, 80, 40, 0.16)',
        'sticker': 'inset 0 -1px 2px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
};

export default config;