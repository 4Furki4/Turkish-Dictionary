"use client";

import { api } from "@/src/trpc/react";
import { useTranslations } from "next-intl";

interface DisplayWordBeingModifiedProps {
  wordId: number;
}

export default function DisplayWordBeingModified({ wordId }: DisplayWordBeingModifiedProps) {
  const t = useTranslations("Requests.details");
  const numericId = Number(wordId);

  const { data, isLoading, isError, error } = api.word.getWordById.useQuery(
    { id: numericId },
    { enabled: !isNaN(numericId) && numericId > 0 }
  );

  if (isNaN(numericId) || numericId <= 0) {
    return <span className="text-sm text-danger-500">{t("invalidWordId")}</span>;
  }

  if (isLoading) {
    return <span className="text-sm text-default-500">{t("loadingWordName")}</span>;
  }

  if (isError) {
    console.error("Error fetching word being modified:", error);
    return <span className="text-sm text-danger-500">{t("errorLoadingWordName")}</span>;
  }

  if (!data || !data.name) {
    return <span className="text-sm text-default-500">{t("wordNameNotFound")}</span>;
  }

  return <span className="font-semibold text-primary">{data.name}</span>;
}
