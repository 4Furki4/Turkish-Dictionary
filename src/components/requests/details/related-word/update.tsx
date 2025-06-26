
// src/components/requests/details/related-word/update.tsx
import { FC } from "react";
import { RequestDetailComponentProps } from "../registry";
import { useRequestResolver } from "../useRequestResolver";
import { DiffTable } from "../DiffTable";
import { RawDataViewer } from "../RawDataViewer";
import { Spinner } from "@heroui/react";
import { UpdateRelatedWordRequestSchema } from "@/src/server/api/schemas/requests";

export const UpdateRelatedWord: FC<RequestDetailComponentProps> = ({ newData, oldData }) => {
  const { resolvedData, isLoading } = useRequestResolver({
    entityType: "related_words",
    action: "update",
    newData: UpdateRelatedWordRequestSchema.parse(newData),
    oldData: UpdateRelatedWordRequestSchema.parse(oldData),
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
