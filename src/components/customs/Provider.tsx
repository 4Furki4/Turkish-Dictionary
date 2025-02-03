"use client";
import React from "react";
import { HeroUIProvider } from "@heroui/react";
import { type ThemeProviderProps } from 'next-themes/dist/types'
import { ThemeProvider } from "next-themes";
export default function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <HeroUIProvider className="min-h-[100dvh] overflow-x-hidden relative flex flex-col place-items-stretch">
      <ThemeProvider
        {...props}
        attribute="class"
        defaultTheme="dark"
        themes={["dark", "light"]}
      >
        {children}
      </ThemeProvider>
    </HeroUIProvider>
  );
}
