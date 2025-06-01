import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { api } from "@/src/trpc/server";
import Link from "next/link";
import Image from "next/image";
import { Button, Card, CardBody, CardHeader } from "@heroui/react";
import { formatDate } from "@/src/utils/date";
import { MarkdownRenderer } from "@/src/components/markdown-renderer";
import { notFound } from "next/navigation";

interface AnnouncementDetailPageProps {
  params: {
    locale: string;
    slug: string;
  };
}

export async function generateMetadata({
  params: { locale, slug },
}: AnnouncementDetailPageProps): Promise<Metadata> {
  try {
    const announcement = await api.announcements.getAnnouncementBySlug({
      slug,
      locale: locale as "en" | "tr",
    });

    return {
      title: announcement.title,
      description: announcement.excerpt || undefined,
      openGraph: announcement.imageUrl
        ? {
            images: [
              {
                url: announcement.imageUrl,
                alt: announcement.title || "",
              },
            ],
          }
        : undefined,
    };
  } catch (error) {
    const t = await getTranslations({ locale, namespace: "Announcements" });
    return {
      title: t("meta.notFound"),
      description: t("meta.notFoundDescription"),
    };
  }
}

export default async function AnnouncementDetailPage({
  params: { locale, slug },
}: AnnouncementDetailPageProps) {
  const t = await getTranslations({ locale, namespace: "Announcements" });

  try {
    const announcement = await api.announcements.getAnnouncementBySlug({
      slug,
      locale: locale as "en" | "tr",
    });

    return (
      <div className="container mx-auto py-8 px-4">
        <div className="mb-6">
          <Link href={`/${locale}/announcements`}>
            <Button variant="ghost" className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              {t("backToAnnouncements")}
            </Button>
          </Link>
        </div>

        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex flex-col gap-2">
              <h1 className="text-3xl font-bold">{announcement.title}</h1>
              <p className="text-sm text-gray-500">
                {formatDate(announcement.publishedAt, locale)}
              </p>
            </div>
          </CardHeader>

          {announcement.imageUrl && (
            <div className="px-6 mb-6 relative w-full h-64">
              <Image
                src={announcement.imageUrl}
                alt={announcement.title || ""}
                fill
                className="object-cover rounded-md"
              />
            </div>
          )}

          <CardBody>
            <div className="prose max-w-none">
              {announcement.content ? (
                <MarkdownRenderer content={announcement.content} />
              ) : (
                <p className="text-gray-600">{t("noContent")}</p>
              )}
            </div>

            {announcement.actionUrl && (
              <div className="mt-8 flex justify-center">
                <a
                  href={announcement.actionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button color="primary" size="lg">
                    {announcement.actionTextKey
                      ? t(announcement.actionTextKey)
                      : t("learnMore")}
                  </Button>
                </a>
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    );
  } catch (error) {
    notFound();
  }
}
