
// src/components/requests/details/related-phrase/delete.tsx
import { FC } from "react";
import { RequestDetailComponentProps } from "../registry";
import { useRequestResolver } from "../useRequestResolver";
import { DataDisplay } from "../DataDisplay";
import { RawDataViewer } from "../RawDataViewer";
import { Spinner } from "@heroui/react";
import { useTranslations } from "next-intl";
import { DeleteRelatedPhraseRequestSchema } from "@/src/server/api/schemas/requests";

export const DeleteRelatedPhrase: FC<RequestDetailComponentProps> = ({ newData }) => {
  const t = useTranslations("RequestDetails.RelatedPhrase");
  const { resolvedData, isLoading } = useRequestResolver({
    entityType: "related_phrases",
    action: "delete",
    newData: DeleteRelatedPhraseRequestSchema.parse(newData), // For delete, newData contains the ID of the item to be deleted
  });

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <>
      <DataDisplay data={resolvedData.new} title={t('deletedRelatedPhrase')} />
      <RawDataViewer data={{ newData }} />
    </>
  );
};
