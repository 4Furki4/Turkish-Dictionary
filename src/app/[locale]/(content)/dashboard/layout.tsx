import { getServerAuthSession } from "@/src/server/auth";
import { RedirectType, redirect } from "next/navigation";
import React from "react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  console.log(session?.user.role);
  if (!["ADMIN", "MODERATOR"].includes(session?.user.role!)) {
    return (
      <h1 className="text-center text-fs-3">
        You are not allowed to access this page. Please contact the
        administrator if you think this is a mistake.
      </h1>
    );
  }
  return <>{children}</>;
}
