import DashboardUnauthorizedMessage from "@/src/_pages/Dashboard/DashboardUnauthorizedLogin";
import { getServerAuthSession } from "@/src/server/auth";
import React from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  if (!["admin", "moderator"].includes(session?.user.role!)) {
    return <DashboardUnauthorizedMessage />;
  }
  return <>{children}</>;
}
