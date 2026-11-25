/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,md,mdx,ts}'],
  theme: {
    extend: {
      colors: {
        patreon: {
          DEFAULT: '#f96854',
          hover: '#e04e3b',
        },
        steam: {
          DEFAULT: '#171a21',
          hover: '#2a3f5a',
        },
        discord: '#7289da',
        github: '#181717',
      },
    },
  },
  plugins: [],
};
