"use client";
import Provider from "@/app/_trpc/Provider";
import { SessionProvider } from "next-auth/react";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Provider>{children}</Provider>
    </SessionProvider>
  );
}
