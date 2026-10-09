import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        sand: {
          50: "#FAF8F5",
          100: "#F5F2EB", // Primary Canvas Background
          200: "#EDE8DE", // Elevated Card / Hull
          300: "#E2DDD1", // Subtle Border / Rule
          400: "#D5CEBF", // Defined Border
          500: "#C5BCAB",
        },
        charcoal: {
          900: "#1A2530",
          800: "#2C3E50", // Primary Heavy Ink
          700: "#3D5266",
          600: "#5A6B7C", // Muted Subtext
          400: "#8898A8", // Subtle Hint
          200: "#CBD5E1",
        },
        sage: {
          50: "#F6F9F5",
          100: "#EEF3EC", // Mastered Surface Tint
          300: "#B9CEB2",
          500: "#88A47E", // Muted Sage Green
          700: "#5F7B56",
          900: "#344C2C", // Sage Contrast Text
        },
        denim: {
          50: "#F0F4FA",
          100: "#E3EBF5",
          300: "#9AB1D4",
          500: "#5B7DB1", // Soft Denim Slate Blue
          700: "#3E5C8A",
          900: "#233857",
        },
        gold: {
          50: "#FDF9EE",
          100: "#FDF4E7", // Fragile Surface Tint
          300: "#F5D67A",
          500: "#DDAA00", // Mustard Gold
          600: "#C69800",
          800: "#705500", // Gold Text Contrast
        },
        terracotta: {
          50: "#FDF5F4",
          100: "#FDF0EE", // Terracotta Surface Tint
          300: "#EA9290",
          500: "#D9534F", // Terracotta Red / RCA Alarm
          700: "#A93330",
          900: "#6E1F1D",
        },
        bauhaus: {
          ink: '#171A21',         // Primary structural black / dark charcoal
          muted: '#525B6C',       // Subtext / metadata
          border: '#D8DEE9',      // Crisp geometric rule lines
          surface: '#FFFFFF',     // Clean card surface
          glass: 'rgba(255, 255, 255, 0.82)',
          blue: '#2563EB',        // Ultramarine / Causal Links
          amber: '#F59E0B',       // Cadmium Gold / Analogical Hobby Anchors
          red: '#EF4444',         // Vermillion / Cognitive RCA Backtrack
          green: '#10B981',       // Bauhaus Sage / Mastered Nodes
        },
        cognitive: {
          mastered: "#10B981",
          fragile: "#F59E0B",
          unverified: "#525B6C",
          alarm: "#EF4444",
          bridge: "#2563EB",
          accent: "#171A21",
        }
      },
      fontFamily: {
        serif: ["Newsreader", "Charter", "Georgia", "Cambria", "Times New Roman", "serif"],
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      animation: {
        'pulse-alarm': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-bridge': 'glowBridge 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glowBridge: {
          '0%': { stroke: '#5B7DB1', strokeWidth: '2.5px', filter: 'drop-shadow(0 0 2px #5B7DB1)' },
          '100%': { stroke: '#88A47E', strokeWidth: '3.5px', filter: 'drop-shadow(0 0 6px #88A47E)' },
        }
      }
    },
  },
  plugins: [],
};

export default config;
