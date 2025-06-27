
// src/components/requests/details/word/create.tsx
import { FC } from "react";
import { RequestDetailComponentProps } from "../registry";
import { useRequestResolver } from "../useRequestResolver";
import { DataDisplay } from "../DataDisplay";
import { CreateWordRequestSchema } from "@/src/server/api/schemas/requests";
import { RawDataViewer } from "../RawDataViewer";
import SchemaErrorDisplay from "../SchemaErrorDisplay";
import { useLocale, useTranslations } from "next-intl";
import { Spinner } from "@heroui/react";

export const CreateWord: FC<RequestDetailComponentProps> = ({ newData }) => {
  const t = useTranslations("RequestDetails");
  const locale = useLocale() as "en" | "tr";
  const safeParsedData = CreateWordRequestSchema.omit({ captchaToken: true }).safeParse(newData);

  const { resolvedData, isLoading } = useRequestResolver({
    entityType: "words",
    action: "create",
    locale,
    newData: safeParsedData.data,
  });
  if (!safeParsedData.success) {
    return <SchemaErrorDisplay error={safeParsedData.error} />;
  }


  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-4">
      <DataDisplay data={resolvedData.new} title={t("Word.title")} />
      <RawDataViewer data={{ newData }} />
    </div>
  );
};
