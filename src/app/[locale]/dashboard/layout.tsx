import Dashboard from "@/src/_pages/Dashboard/Dashboard";
import DashboardUnauthorizedMessage from "@/src/_pages/Dashboard/DashboardUnauthorizedLogin";
import { getServerAuthSession } from "@/src/server/auth";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "CRUD operations for the Turkish Dictionary",
}


export default async function DashboardLayout({
  children,
  locale,
}: {
  children: React.ReactNode;
  locale: string,
}) {
  const session = await getServerAuthSession();
  if (!["admin", "moderator"].includes(session?.user.role!)) {
    return <DashboardUnauthorizedMessage />;
  }
  return (
    <Dashboard locale={locale}>
      {children}
    </Dashboard>
  )
}
