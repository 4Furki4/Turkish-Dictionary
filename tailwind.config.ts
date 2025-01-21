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
        // foreground: "hsl(var(--foreground))",
        // primary: {
        //   DEFAULT: "hsl(var(--primary))",
        //   foreground: "hsl(var(--primary-foreground))",
        // },
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
      prefix: "nextui-",
      themes: {
        dark: {
          colors: {
            content1: {
              DEFAULT: "#0F0E0E",
              foreground: "#ffffff",
            },
            danger: {
              DEFAULT: "#FF0000",
              foreground: "#ffffff",
            },
          },
        },
        light: {
          colors: {
            primary: {
              foreground: "#000000",
            },
            content1: {
              DEFAULT: "#F9F5F6",
              foreground: "#0F0E0E",
            },
            danger: {
              DEFAULT: "#FF0000",
              foreground: "#ffffff",
            },
          },
        },
        "dark-purple": {
          extend: "dark",
          colors: {
            default: {
              DEFAULT: "#27005D",
              foreground: "#ffffff",
            },
            background: {
              DEFAULT: "#27005D",
              foreground: "#E4F1FF",
            },
            foreground: "#ffffff",
            primary: { DEFAULT: "#5800FF", foreground: "#FFCEFE" },
            content1: {
              DEFAULT: "#100637",
              foreground: "#ffffff",
            },
            danger: {
              DEFAULT: "#FF0000",
              foreground: "#ffffff",
            },
          },
        },
        "light-purple": {
          extend: "light",
          colors: {
            primary: {
              DEFAULT: "#5800FF",
              foreground: "#ffffff",
            },
            background: {
              DEFAULT: "#B2A4FF",
            },
            foreground: "#27005D",
            focus: "#F182F6",
            content1: {
              DEFAULT: "#d4ccff",
              foreground: "#27005D",
            },
            danger: {
              DEFAULT: "#FF0000",
              foreground: "#ffffff",
            },
          },
        },
      },
      layout: {
        radius: {
          small: "calc(var(--radius) - 6px)",
          medium: "calc(var(--radius) - 4px)",
          large: "calc(var(--radius) - 2px)"
        },
      }
    }),
  ],
});
