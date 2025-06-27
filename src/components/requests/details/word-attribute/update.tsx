
// src/components/requests/details/word-attribute/update.tsx
import { FC } from "react";
import { RequestDetailComponentProps } from "../registry";
import { useRequestResolver } from "../useRequestResolver";
import { DiffTable } from "../DiffTable";
import { RawDataViewer } from "../RawDataViewer";
import { Spinner } from "@heroui/react";
import { UpdateWordAttributeRequestSchema } from "@/src/server/api/schemas/requests";
import { useLocale } from "next-intl";

export const UpdateWordAttribute: FC<RequestDetailComponentProps> = ({ newData, oldData }) => {
  const locale = useLocale()
  const { resolvedData, isLoading } = useRequestResolver({
    entityType: "word_attributes",
    action: "update",
    newData: UpdateWordAttributeRequestSchema.parse(newData),
    oldData: UpdateWordAttributeRequestSchema.parse(oldData),
    locale,
  });

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <>
      <DiffTable oldData={resolvedData.old} newData={resolvedData.new} />
      <RawDataViewer data={{ newData, oldData }} />
    </>
  );
};
