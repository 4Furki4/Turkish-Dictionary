
// src/components/requests/details/word/update.tsx
import { FC } from "react";
import { RequestDetailComponentProps } from "../registry";
import { useRequestResolver } from "../useRequestResolver";
import { DiffTable } from "../DiffTable";
import { RawDataViewer } from "../RawDataViewer";
import { Spinner } from "@heroui/react";
import { UpdateWordRequestSchema } from "@/src/server/api/schemas/requests";

export const UpdateWord: FC<RequestDetailComponentProps> = ({ newData, oldData }) => {
  const { resolvedData, isLoading } = useRequestResolver({
    entityType: "words",
    action: "update",
    newData: UpdateWordRequestSchema.parse(newData),
    oldData: UpdateWordRequestSchema.omit({ reason: true }).parse(oldData),
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
