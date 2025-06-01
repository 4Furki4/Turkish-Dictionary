import { getTranslations } from "next-intl/server";
import { Metadata } from "next";
import EditAnnouncementPage from "@/src/_pages/dashboard/announcements/[id]/edit/page";

interface EditAnnouncementPageParams {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export async function generateMetadata(
  { params }: EditAnnouncementPageParams
): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: "Dashboard.Announcements" });

  return {
    title: t("editAnnouncement", { slug: id }),
    description: t("editDescription"),
  };
}

export default function EditAnnouncement() {
  return <EditAnnouncementPage />;
}
