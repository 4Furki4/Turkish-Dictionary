"use client";
import React from "react";
import { HeroUIProvider } from "@heroui/react";
import dynamic from "next/dynamic";
const NextThemesProvider = dynamic(
  () => import('next-themes').then((e) => e.ThemeProvider),
  {
    ssr: false,
  }
)
import { type ThemeProviderProps } from 'next-themes/dist/types'
export default function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <HeroUIProvider className="min-h-[100dvh] overflow-x-hidden relative flex flex-col place-items-stretch">
      <NextThemesProvider
        {...props}
        attribute="class"
        defaultTheme="dark"
        themes={["dark", "light", "dark-purple", "light-purple"]}
      >
        {children}
      </NextThemesProvider>
    </HeroUIProvider>
  );
}
