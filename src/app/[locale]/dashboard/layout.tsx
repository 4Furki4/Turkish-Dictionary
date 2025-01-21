import Dashboard from "@/src/_pages/Dashboard/Dashboard";
import DashboardUnauthorizedMessage from "@/src/_pages/Dashboard/DashboardUnauthorizedLogin";
import { getServerAuthSession } from "@/src/server/auth/auth";
import { Metadata } from "next";
import React, { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "CRUD operations for the Turkish Dictionary",
}


export default async function DashboardLayout(
  props: {
    children?: ReactNode;
    params: Promise<{
      locale: string
    }>
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  const session = await getServerAuthSession();
  if (!["admin", "moderator"].includes(session?.user.role!)) {
    return <DashboardUnauthorizedMessage />;
  }
  return (
    <Dashboard locale={params.locale}>
      {children}
    </Dashboard>
  )
}
