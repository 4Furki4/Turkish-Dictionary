import { Metadata } from "next";

import { getTranslations } from "next-intl/server";
import WordRelationsManager from "./_components/word-relations-manager";

interface PageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params
}: PageProps): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Word Relations Management",
  };
}

export default async function WordRelationsPage({
  params
}: PageProps) {
  const { locale } = await params;
  const t = await getTranslations("Dashboard.WordRelations");

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
      <p className="mb-6">{t("description")}</p>

      <WordRelationsManager />
    </div>
  );
}
