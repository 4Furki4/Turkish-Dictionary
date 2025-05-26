import { getTranslations } from "next-intl/server";
import AnnouncementForm from "@/src/_pages/dashboard/announcements/announcement-form";
import { Metadata } from "next";

export async function generateMetadata(
  { params: { locale } }: { params: { locale: string } }
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Dashboard.Announcements" });
  
  return {
    title: t("createNew"),
    description: t("createDescription"),
  };
}

export default function NewAnnouncementPage() {
  return (
    <div className="container mx-auto py-6">
      <AnnouncementForm />
    </div>
  );
}
