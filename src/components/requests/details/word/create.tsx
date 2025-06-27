
// src/components/requests/details/word/create.tsx
import { FC } from "react";
import { RequestDetailComponentProps } from "../registry";
import { useRequestResolver } from "../useRequestResolver";
import { DataDisplay } from "../DataDisplay";
import { RawDataViewer } from "../RawDataViewer";
import { Spinner } from "@heroui/react";
import { useLocale, useTranslations } from "next-intl";
import { CreateWordRequestSchema } from "@/src/server/api/schemas/requests";

export const CreateWord: FC<RequestDetailComponentProps> = ({ newData }) => {
  const t = useTranslations("RequestDetails.Word");
  const locale = useLocale()
  const { resolvedData, isLoading } = useRequestResolver({
    entityType: "words",
    action: "create",
    newData: CreateWordRequestSchema.omit({ captchaToken: true }).parse(newData),
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
