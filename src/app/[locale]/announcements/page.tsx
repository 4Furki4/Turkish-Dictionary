import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { api } from "@/src/trpc/server";
import { Pagination } from "@heroui/react";
import Announcement from "@/src/_pages/announcements/announcements-card";

interface AnnouncementsPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

export async function generateMetadata({
  params
}: AnnouncementsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Announcements" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function AnnouncementsPage({
  params,
  searchParams,
}: AnnouncementsPageProps) {
  const { locale } = await params;
  const { page } = await searchParams;
  const t = await getTranslations({ locale, namespace: "Announcements" });
  const pageNumber = Number(page) || 1;
  const { items, meta } = await api.announcements.listPublishedAnnouncements({
    page: pageNumber,
    limit: 10,
    locale: locale as "en" | "tr",
    orderBy: "publishedAt",
    orderDirection: "desc",
  });

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">{t("title")}</h1>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-lg text-gray-400">{t("noAnnouncements")}</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {items.map((announcement) => (
            <Announcement
              key={announcement.id}
              announcement={announcement}
              locale={locale}
            />
          ))}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            total={meta.totalPages}
            initialPage={pageNumber}
            onChange={(newPage) => {
              window.location.href = `/${locale}/announcements?page=${newPage}`;
            }}
          />
        </div>
      )}
    </div>
  );
}
