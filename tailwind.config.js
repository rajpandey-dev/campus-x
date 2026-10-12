/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        /*
         * CampusX new design system
         */
        campus: {
          black: "#111111",
          dark: "#181818",
          white: "#FFFFFF",

          yellow: "#FFF3A3",
          lime: "#C9F27A",

          gray: "#F5F5F5",
          muted: "#707070",
          border: "#E8E8E8",
        },

        /*
         * Compatibility aliases
         *
         * Existing components already use these names.
         * Keeping them prevents us from breaking
         * the current application.
         */
        surface: "#FFFFFF",
        maroon: "#111111",
        wine: "#B7E63A",
        gold: "#FFE500",
        cream: "#111111",
      },

      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },

      borderRadius: {
        campus: "24px",
        "campus-lg": "32px",
      },

      boxShadow: {
        glow: "0 8px 24px rgba(255, 229, 0, 0.25)",
        campus: "0 8px 30px rgba(0, 0, 0, 0.08)",
        "campus-hover": "0 14px 40px rgba(0, 0, 0, 0.12)",
      },
    },
  },

  plugins: [],
};