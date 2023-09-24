"use client";
import Provider from "@/app/_trpc/Provider";
import Navbar from "@/components/customs/Navbar";
import { SessionProvider } from "next-auth/react";
import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Provider>
        <Navbar />
        {children}
      </Provider>
    </SessionProvider>
  );
}
