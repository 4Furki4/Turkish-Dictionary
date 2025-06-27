
// src/components/requests/details/word-attribute/create.tsx
import { FC } from "react";
import { RequestDetailComponentProps } from "../registry";
import { useRequestResolver } from "../useRequestResolver";
import { DataDisplay } from "../DataDisplay";
import { RawDataViewer } from "../RawDataViewer";
import { Spinner } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { CreateWordAttributeRequestSchema } from "@/src/server/api/schemas/requests";

export const CreateWordAttribute: FC<RequestDetailComponentProps> = ({ newData }) => {
  const locale = useLocale()
  const t = useTranslations("RequestDetails.WordAttribute");
  const { resolvedData, isLoading } = useRequestResolver({
    entityType: "word_attributes",
    action: "create",
    newData: CreateWordAttributeRequestSchema.parse(newData),
    locale,
  });

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <>
      <DataDisplay data={resolvedData.new} title={t('title')} />
      <RawDataViewer data={{ newData }} />
    </>
  );
};
