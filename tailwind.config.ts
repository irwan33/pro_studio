import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        studio: {
          bg: "#F4F4F2",
          secondary: "#FFFFFF",
          panel: "#FFFFFF",
          elevated: "#F1F1EF",
          input: "#F7F7F5",
          border: "#DEDED9",
          accent: "#111111",
          accentHover: "#E6E6E2",
          text: "#151515",
          muted: "#7A7A74",
          secondaryText: "#555550"
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        display: ["Archivo Black", "Anton", "Impact", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular"]
      },
      boxShadow: {
        lime: "0 6px 22px rgba(0,0,0,0.10), inset 0 0 0 1px rgba(255,255,255,0.70)"
      }
    }
  },
  plugins: []
};

export default config;
