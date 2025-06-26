
// src/components/requests/details/word-attribute/update.tsx
import { FC } from "react";
import { RequestDetailComponentProps } from "../registry";
import { useRequestResolver } from "../useRequestResolver";
import { DiffTable } from "../DiffTable";
import { RawDataViewer } from "../RawDataViewer";
import { Spinner } from "@heroui/react";
import { UpdateWordAttributeRequestSchema } from "@/src/server/api/schemas/requests";

export const UpdateWordAttribute: FC<RequestDetailComponentProps> = ({ newData, oldData }) => {
  const { resolvedData, isLoading } = useRequestResolver({
    entityType: "word_attributes",
    action: "update",
    newData: UpdateWordAttributeRequestSchema.parse(newData),
    oldData: UpdateWordAttributeRequestSchema.parse(oldData),
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
