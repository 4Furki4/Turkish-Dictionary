
// src/components/requests/details/related-word/delete.tsx
import { FC } from "react";
import { RequestDetailComponentProps } from "../registry";
import { useRequestResolver } from "../useRequestResolver";
import { DataDisplay } from "../DataDisplay";
import { DeleteRelatedWordRequestSchema } from "@/src/server/api/schemas/requests";
import { RawDataViewer } from "../RawDataViewer";
import SchemaErrorDisplay from "../SchemaErrorDisplay";
import { useLocale, useTranslations } from "next-intl";
import { Spinner } from "@heroui/react";

export const DeleteRelatedWord: FC<RequestDetailComponentProps> = ({ oldData }) => {
  const t = useTranslations("RequestDetails");
  const locale = useLocale() as "en" | "tr";
  const safeParsedData = DeleteRelatedWordRequestSchema.safeParse(oldData);
  const { resolvedData, isLoading } = useRequestResolver({
    entityType: "related_words",
    action: "delete",
    locale,
    oldData: safeParsedData.data,
  });

  if (!safeParsedData.success) {
    return <SchemaErrorDisplay error={safeParsedData.error} />;
  }



  if (isLoading) {
    return <Spinner />
  }

  return (
    <div className="space-y-4">
      <DataDisplay data={resolvedData.old} title={t("RelatedWord.deletedRelatedWord")} />
      <RawDataViewer data={{ oldData }} />
    </div>
  );
};
