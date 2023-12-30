import Dashboard from "@/src/_pages/Dashboard/Dashboard";
import { api } from "@/src/trpc/server";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard",
  robots: {
    follow: false,
    index: false,
    googleBot: {
      follow: false,
      index: false,
    },
  },
};

export default async function Page() {
  // const words = await api.word.getWords.query({});
  const words = [] as any;
  return (
    <>
      <Dashboard words={words} />
    </>
  );
}
