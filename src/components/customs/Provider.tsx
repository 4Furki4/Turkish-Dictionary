"use client";
import React from "react";
import { NextUIProvider } from "@nextui-org/react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextUIProvider>
      <NextThemesProvider
        attribute="class"
        defaultTheme="dark"
        themes={["dark", "light", "dark-purple", "light-purple"]}
      >
        {children}
      </NextThemesProvider>
    </NextUIProvider>
  );
}
