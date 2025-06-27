
// src/components/requests/details/meaning/delete.tsx
import { FC } from "react";
import { RequestDetailComponentProps } from "../registry";
import { useRequestResolver } from "../useRequestResolver";
import { DataDisplay } from "../DataDisplay";
import { RawDataViewer } from "../RawDataViewer";
import { Spinner } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { DeleteMeaningRequestSchema } from "@/src/server/api/schemas/requests";

export const DeleteMeaning: FC<RequestDetailComponentProps> = ({ oldData }) => {
  const t = useTranslations("RequestDetails.Meaning");
  const locale = useLocale()
  const { resolvedData, isLoading } = useRequestResolver({
    entityType: "meanings",
    action: "delete",
    oldData: DeleteMeaningRequestSchema.parse(oldData),
    locale,
  });

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <>
      <DataDisplay data={resolvedData.old} title={t('deletedMeaning')} />
      <RawDataViewer data={{ oldData }} />
    </>
  );
};
