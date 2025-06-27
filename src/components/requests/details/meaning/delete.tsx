
// src/components/requests/details/meaning/delete.tsx
import { FC } from "react";
import { RequestDetailComponentProps } from "../registry";
import { useRequestResolver } from "../useRequestResolver";
import { DataDisplay } from "../DataDisplay";
import { DeleteMeaningRequestSchema } from "@/src/server/api/schemas/requests";
import { RawDataViewer } from "../RawDataViewer";
import SchemaErrorDisplay from "../SchemaErrorDisplay";
import { useLocale, useTranslations } from "next-intl";
import { Spinner } from "@heroui/react";

export const DeleteMeaning: FC<RequestDetailComponentProps> = ({ oldData }) => {
  const t = useTranslations("RequestDetails");
  const locale = useLocale() as "en" | "tr";
  const safeParsedData = DeleteMeaningRequestSchema.safeParse(oldData);
  const { resolvedData, isLoading } = useRequestResolver({
    entityType: "meanings",
    action: "delete",
    locale,
    oldData: safeParsedData.data,
  });

  if (!safeParsedData.success) {
    return <SchemaErrorDisplay error={safeParsedData.error} />;
  }


  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-4">
      <DataDisplay data={resolvedData.old} title={t("Meaning.deletedMeaning")} />
      <RawDataViewer data={{ oldData }} />
    </div>
  );
};
