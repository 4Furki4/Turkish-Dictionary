
// src/components/requests/details/word-attribute/create.tsx
import { FC } from "react";
import { RequestDetailComponentProps } from "../registry";
import { useRequestResolver } from "../useRequestResolver";
import { DataDisplay } from "../DataDisplay";
import { CreateWordAttributeRequestSchema } from "@/src/server/api/schemas/requests";
import { RawDataViewer } from "../RawDataViewer";
import SchemaErrorDisplay from "../SchemaErrorDisplay";
import { useLocale, useTranslations } from "next-intl";
import { Spinner } from "@heroui/react";

export const CreateWordAttribute: FC<RequestDetailComponentProps> = ({ newData }) => {
  const t = useTranslations("RequestDetails");
  const locale = useLocale() as "en" | "tr";
  const safeParsedData = CreateWordAttributeRequestSchema.safeParse(newData);
  const { resolvedData, isLoading } = useRequestResolver({
    entityType: "word_attributes",
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
      <DataDisplay data={resolvedData.new} title={t("WordAttribute.title")} />
      <RawDataViewer data={{ newData }} />
    </div>
  );
};
