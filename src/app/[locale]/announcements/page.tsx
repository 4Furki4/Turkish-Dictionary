import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { api } from "@/src/trpc/server";
import Link from "next/link";
import Image from "next/image";
import { Card, CardBody, CardHeader, Button, Pagination } from "@heroui/react";
import { formatDate } from "@/src/utils/date";

interface AnnouncementsPageProps {
  params: {
    locale: string;
  };
  searchParams: {
    page?: string;
  };
}

export async function generateMetadata({
  params: { locale },
}: AnnouncementsPageProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "Announcements" });

  return {
    title: t("meta.title"),
    description: t("meta.description"),
  };
}

export default async function AnnouncementsPage({
  params: { locale },
  searchParams,
}: AnnouncementsPageProps) {
  const t = await getTranslations({ locale, namespace: "Announcements" });
  const page = Number(searchParams.page) || 1;
  
  const { items, meta } = await api.announcements.listPublishedAnnouncements({
    page,
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
          <p className="text-lg text-gray-600">{t("noAnnouncements")}</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {items.map((announcement) => (
            <Card key={announcement.id} className="overflow-hidden">
              <CardHeader className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">{announcement.title}</h2>
                <span className="text-sm text-gray-500">
                  {formatDate(announcement.publishedAt, locale)}
                </span>
              </CardHeader>
              
              <CardBody>
                {announcement.imageUrl && (
                  <div className="mb-4 relative w-full h-48">
                    <Image 
                      src={announcement.imageUrl} 
                      alt={announcement.title || ""}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                )}
                
                <p className="text-gray-700 mb-4">{announcement.excerpt}</p>
                
                <div className="flex justify-end">
                  <Link href={`/${locale}/announcements/${announcement.slug}`}>
                    <Button color="primary">
                      {t("readMore")}
                    </Button>
                  </Link>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
      
      {meta.totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <Pagination
            total={meta.totalPages}
            initialPage={page}
            onChange={(newPage) => {
              window.location.href = `/${locale}/announcements?page=${newPage}`;
            }}
          />
        </div>
      )}
    </div>
  );
}
