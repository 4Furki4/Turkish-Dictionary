"use client";
import Provider from "@/components/customs/Provider";
import Navbar from "@/components/customs/Navbar";
import { SessionProvider } from "next-auth/react";
import React from "react";
import { ToastContainer } from "react-toastify";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <main className="">{children}</main>
      <ToastContainer limit={4} />
    </SessionProvider>
  );
}
