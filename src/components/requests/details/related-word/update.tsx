
// src/components/requests/details/related-word/update.tsx
import { FC } from "react";
import { RequestDetailComponentProps } from "../registry";
import { useRequestResolver } from "../useRequestResolver";
import { DiffTable } from "../DiffTable";
import { UpdateRelatedWordRequestSchema } from "@/src/server/api/schemas/requests";
import { RawDataViewer } from "../RawDataViewer";
import SchemaErrorDisplay from "../SchemaErrorDisplay";
import { useLocale, useTranslations } from "next-intl";
import { Spinner } from "@heroui/react";

export const UpdateRelatedWord: FC<RequestDetailComponentProps> = ({ newData, oldData }) => {
  const t = useTranslations("RequestDetails");
  const locale = useLocale() as "en" | "tr";
  const safeParsedNewData = UpdateRelatedWordRequestSchema.safeParse(newData);
  const safeParsedOldData = UpdateRelatedWordRequestSchema.safeParse(oldData);


  const { resolvedData, isLoading } = useRequestResolver({
    entityType: "related_words",
    action: "update",
    locale,
    newData: safeParsedNewData.data,
    oldData: safeParsedOldData.data,
  });
  if (!safeParsedNewData.success) {
    return <SchemaErrorDisplay error={safeParsedNewData.error} title={t("DiffTable.newValue")} />;
  }

  if (!safeParsedOldData.success) {
    return <SchemaErrorDisplay error={safeParsedOldData.error} title={t("DiffTable.oldValue")} />;
  }


  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="space-y-4">
      <DiffTable oldData={resolvedData.old} newData={resolvedData.new} />
      <RawDataViewer data={{ newData, oldData }} />
    </div>
  );
};
