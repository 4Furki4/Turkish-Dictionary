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
      addCommonColors: true,
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
            focus: {
              100: "#F9D9CC",
              200: "#F3AD9C",
              300: "#DC7266",
              400: "#BA3E3D",
              500: "#8C0F19",
              600: "#780A1D",
              700: "#64071F",
              800: "#51041F",
              900: "#43021F"
            },
            primary: {
              100: "#F9D9CC",
              200: "#F3AD9C",
              300: "#DC7266",
              400: "#BA3E3D",
              500: "#8C0F19",
              600: "#780A1D",
              700: "#64071F",
              800: "#51041F",
              900: "#43021F"
            },
            success: {
              100: "#E8FAD0",
              200: "#CDF5A4",
              300: "#A4E172",
              400: "#79C44B",
              500: "#459E1C",
              600: "#318714",
              700: "#20710E",
              800: "#125B08",
              900: "#094B05"
            },
            secondary: {
              100: "#CCE5FA",
              200: "#9BC8F5",
              300: "#66A0E3",
              400: "#3E78C7",
              500: "#0E47A3",
              600: "#0A368C",
              700: "#072875",
              800: "#041C5E",
              900: "#02134E"
            },
            warning: {
              100: "#F9FACA",
              200: "#F4F696",
              300: "#E2E660",
              400: "#C9CD37",
              500: "#A7AD05",
              600: "#8F9403",
              700: "#777C02",
              800: "#5F6401",
              900: "#4E5300"
            },
            danger: {
              100: "#FBD7CE",
              200: "#F7A79E",
              300: "#E86C6B",
              400: "#D24552",
              500: "#B51331",
              600: "#9B0D35",
              700: "#820936",
              800: "#680634",
              900: "#560332"
            }
          }
        },
        dark: {
          colors: {
            focus: {
              100: "#43021F",
              200: "#51041F",
              300: "#64071F",
              400: "#780A1D",
              500: "#8C0F19",
              600: "#BA3E3D",
              700: "#DC7266",
              800: "#F3AD9C",
              900: "#F9D9CC"
            },
            primary: {
              100: "#43021F",
              200: "#51041F",
              300: "#64071F",
              400: "#780A1D",
              500: "#8C0F19",
              600: "#BA3E3D",
              700: "#DC7266",
              800: "#F3AD9C",
              900: "#F9D9CC"
            },
            success: {
              100: "#094B05",
              200: "#125B08",
              300: "#20710E",
              400: "#318714",
              500: "#459E1C",
              600: "#79C44B",
              700: "#A4E172",
              800: "#CDF5A4",
              900: "#E8FAD0"
            },
            secondary: {
              100: "#02134E",
              200: "#041C5E",
              300: "#072875",
              400: "#0A368C",
              500: "#0E47A3",
              600: "#3E78C7",
              700: "#66A0E3",
              800: "#9BC8F5",
              900: "#CCE5FA"
            },
            warning: {
              100: "#4E5300",
              200: "#5F6401",
              300: "#777C02",
              400: "#8F9403",
              500: "#A7AD05",
              600: "#C9CD37",
              700: "#E2E660",
              800: "#F4F696",
              900: "#F9FACA"
            },
            danger: {
              100: "#560332",
              200: "#680634",
              300: "#820936",
              400: "#9B0D35",
              500: "#B51331",
              600: "#D24552",
              700: "#E86C6B",
              800: "#F7A79E",
              900: "#FBD7CE"
            }
          }
        }
      }
    }),
  ],
});
