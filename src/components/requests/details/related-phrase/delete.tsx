
// src/components/requests/details/related-phrase/delete.tsx
import { FC } from "react";
import { RequestDetailComponentProps } from "../registry";
import { useRequestResolver } from "../useRequestResolver";
import { DataDisplay } from "../DataDisplay";
import { DeleteRelatedPhraseRequestSchema } from "@/src/server/api/schemas/requests";
import { RawDataViewer } from "../RawDataViewer";
import SchemaErrorDisplay from "../SchemaErrorDisplay";
import { useLocale, useTranslations } from "next-intl";

export const DeleteRelatedPhrase: FC<RequestDetailComponentProps> = ({ oldData }) => {
  const t = useTranslations("RequestDetails");
  const locale = useLocale() as "en" | "tr";
  const safeParsedData = DeleteRelatedPhraseRequestSchema.safeParse(oldData);

  const { resolvedData, isLoading } = useRequestResolver({
    entityType: "related_phrases",
    action: "delete",
    locale,
    oldData: safeParsedData.data,
  });

  if (!safeParsedData.success) {
    return <SchemaErrorDisplay error={safeParsedData.error} />;
  }


  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <DataDisplay data={resolvedData.old} title={t("RelatedPhrase.deletedRelatedPhrase")} />
      <RawDataViewer data={{ oldData }} />
    </div>
  );
};
