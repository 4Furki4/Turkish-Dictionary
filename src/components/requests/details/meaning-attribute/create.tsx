// src/components/requests/details/meaning-attribute/create.tsx
import { FC } from "react";
import { RequestDetailComponentProps } from "../registry";
import { useRequestResolver } from "../useRequestResolver";
import { DataDisplay } from "../DataDisplay";
import { CreateMeaningAttributeRequestSchema } from "@/src/server/api/schemas/requests";
import { RawDataViewer } from "../RawDataViewer";
import SchemaErrorDisplay from "../SchemaErrorDisplay";
import { useLocale, useTranslations } from "next-intl";
import { Spinner } from "@heroui/react";

export const CreateMeaningAttribute: FC<RequestDetailComponentProps> = ({ newData }) => {
  const t = useTranslations("RequestDetails");
  const locale = useLocale() as "en" | "tr";
  const safeParsedData = CreateMeaningAttributeRequestSchema.safeParse(newData);
  const { resolvedData, isLoading } = useRequestResolver({
    entityType: "meaning_attributes",
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
      <DataDisplay data={resolvedData.new} title={t("MeaningAttribute.title")} />
      <RawDataViewer data={{ newData }} />
    </div>
  );
};
