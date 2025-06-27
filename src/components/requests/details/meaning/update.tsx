
// src/components/requests/details/meaning/update.tsx
import { FC } from "react";
import { RequestDetailComponentProps } from "../registry";
import { useRequestResolver } from "../useRequestResolver";
import { DiffTable } from "../DiffTable";
import { RawDataViewer } from "../RawDataViewer";
import { Spinner } from "@heroui/react";
import { UpdateMeaningRequestSchema } from "@/src/server/api/schemas/requests";
import { useLocale } from "next-intl";

export const UpdateMeaning: FC<RequestDetailComponentProps> = ({ newData, oldData }) => {
  const locale = useLocale()
  const { resolvedData, isLoading } = useRequestResolver({
    entityType: "meanings",
    action: "update",
    newData: UpdateMeaningRequestSchema.parse(newData),
    oldData: UpdateMeaningRequestSchema.parse(oldData),
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
