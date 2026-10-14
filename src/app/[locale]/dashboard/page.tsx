import { DashboardOverview } from "@/src/_pages/dashboard/overview/dashboard-overview";
import { api, HydrateClient } from "@/src/trpc/server";
import { Metadata } from "next";
import React from "react";
import { readDashboardRange } from "@/src/server/api/schemas/dashboard";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard overview",
  robots: {
    follow: false,
    index: false,
    googleBot: {
      follow: false,
      index: false,
    },
  },
};

export default async function DashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const referenceTime = new Date();
  const raw = await searchParams;
  const params = new URLSearchParams(Object.entries(raw).flatMap(([key, value]) => {
    const first = Array.isArray(value) ? value[0] : value;
    return typeof first === "string" ? [[key, first]] : [];
  }));
  const { selection } = readDashboardRange(params, referenceTime);
  void api.admin.overview.getDashboardOverview.prefetch(selection);

  return (
    <HydrateClient>
      <DashboardOverview referenceTime={referenceTime} />
    </HydrateClient>
  );
}
