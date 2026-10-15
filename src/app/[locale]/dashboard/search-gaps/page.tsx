import { getTranslations } from "next-intl/server";
import { SearchGaps } from "@/src/_pages/dashboard/search-gaps/search-gaps";
import { auth } from "@/src/lib/auth";
import { headers } from "next/headers";
import DashboardUnauthorizedMessage from "@/src/_pages/dashboard/dashboard-unauthorized-login";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard.searchGaps" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function SearchGapsPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") return <DashboardUnauthorizedMessage />;
  return <SearchGaps referenceTime={new Date()} />;
}
