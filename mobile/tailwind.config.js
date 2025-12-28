/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#F7F8FA",
          card: "#FFFFFF",
        },
        primary: {
          DEFAULT: "#4F46E5", // indigo
          foreground: "#FFFFFF",
        },
        success: "#22C55E",
        danger: "#EF4444",
        muted: "#6B7280",
        border: "#E5E7EB",
      },
      borderRadius: {
        xl: "16px",
        "2xl": "20px",
        "3xl": "24px",
      },
      boxShadow: {
        card: "0 8px 24px rgba(0,0,0,0.06)",
        soft: "0 4px 12px rgba(0,0,0,0.05)",
      },
      spacing: {
        screen: "24px",
      },
    },
  },
  plugins: [],
}