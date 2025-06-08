import { getTranslations } from "next-intl/server";
import AnnouncementsList from "@/src/_pages/dashboard/announcements/announcements-list";
import { Metadata } from "next";

export async function generateMetadata(
  { params }: { params: Promise<{ locale: string }> }
): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard.Announcements" });

  return {
    title: t("title"),
    description: t("createDescription"),
  };
}

export default function AnnouncementsPage() {
  return <AnnouncementsList />;
}
