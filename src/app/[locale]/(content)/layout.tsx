"use client";
import { Toaster } from "@/src/components/customs/Sonner";
import { SessionProvider } from "next-auth/react";
import { useTheme } from "next-themes";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { theme = "system" } = useTheme()
  return (
    <SessionProvider>
      <main className="">{children}</main>
      <Toaster />
    </SessionProvider>
  );
}
