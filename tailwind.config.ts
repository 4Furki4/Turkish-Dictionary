import { heroui } from "@heroui/react";
/** @type {import('tailwindcss').Config} */
import { withUt } from "uploadthing/tw";

export default withUt({
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: ["hidden"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontSize: {
        "fs--2": "var(--step--2)",
        "fs--1": "var(--step--1)",
        "fs-0": "var(--step-0)",
        "fs-1": "var(--step-1)",
        "fs-2": "var(--step-2)",
        "fs-3": "var(--step-3)",
        "fs-4": "var(--step-4)",
        "fs-5": "var(--step-5)",
        "fs-6": "var(--step-6)",
        "fs-7": "var(--step-7)",
        "fs-8": "var(--step-8)",
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    heroui({
      prefix: "heroui-",
      layout: {
        radius: {
          small: "calc(var(--radius) - 6px)",
          medium: "calc(var(--radius) - 4px)",
          large: "var(--radius)",
        },
      },
      themes: {
        light: {
          colors: {

            primary: {
              DEFAULT: "#a91101",
              50: '#ffe5e2',
              100: '#ffb9b1',
              200: '#ff8b7f',
              300: '#fe5e4e',
              400: '#fd321c',
              500: '#e31a02',
              600: '#b11201',
              700: '#800b00',
              800: '#4e0500',
              900: '#1f0000',
              foreground: "hsl(355.7 100% 97.3%)",
            },
            secondary: {
              DEFAULT: "#dbfcff",
              50: '#dbfcff',
              100: '#b1f2ff',
              200: '#83e8fb',
              300: '#57dff9',
              400: '#33d5f7',
              500: '#24bcdd',
              600: '#1493ac',
              700: '#04697c',
              800: '#003f4b',
              900: '#00171d',
              foreground: "hsl(240 5.9% 10%)",
            },
            danger: {
              DEFAULT: "hsl(5.71 98.82% 33.33%)",
              foreground: "hsl(0 0% 98%)",
            },
            focus: {
              DEFAULT: "hsl(5.71 98.82% 33.33%)",
              foreground: "hsl(355.7 100% 97.3%)",
            },
          },
        },
        dark: {
          colors: {
            primary: {
              DEFAULT: "#a91101",
              50: '#ffe5e2',
              100: '#ffb9b1',
              200: '#ff8b7f',
              300: '#fe5e4e',
              400: '#fd321c',
              500: '#e31a02',
              600: '#b11201',
              700: '#800b00',
              800: '#4e0500',
              900: '#1f0000',
              foreground: "hsl(355.7 100% 97.3%)",
            },
            secondary: {
              DEFAULT: "#83e8fb",
              50: '#dbfcff',
              100: '#b1f2ff',
              200: '#83e8fb',
              300: '#57dff9',
              400: '#33d5f7',
              500: '#24bcdd',
              600: '#1493ac',
              700: '#04697c',
              800: '#003f4b',
              900: '#00171d',
              foreground: "hsl(0 0% 98%)",
            },
            danger: {
              DEFAULT: "hsl(5.71 98.82% 33.33%)",
              foreground: "hsl(0 0% 98%)",
            },
            focus: {
              DEFAULT: "hsl(5.71 98.82% 33.33%)",
              foreground: "hsl(355.7 100% 97.3%)",
            }
          },
        },
      }
    }),
  ],
});
