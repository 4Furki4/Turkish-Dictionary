
// src/components/requests/details/related-word/delete.tsx
import { FC } from "react";
import { RequestDetailComponentProps } from "../registry";
import { useRequestResolver } from "../useRequestResolver";
import { DataDisplay } from "../DataDisplay";
import { RawDataViewer } from "../RawDataViewer";
import { Spinner } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { DeleteRelatedWordRequestSchema } from "@/src/server/api/schemas/requests";

export const DeleteRelatedWord: FC<RequestDetailComponentProps> = ({ newData }) => {
  const t = useTranslations("RequestDetails.RelatedWord");
  const locale = useLocale()
  const { resolvedData, isLoading } = useRequestResolver({
    entityType: "related_words",
    action: "delete",
    newData: DeleteRelatedWordRequestSchema.parse(newData), // For delete, newData contains the ID of the item to be deleted,
    locale,
  });

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <>
      <DataDisplay data={resolvedData.new} title={t('deletedRelatedWord')} />
      <RawDataViewer data={{ newData }} />
    </>
  );
};
