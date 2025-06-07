"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/src/trpc/react";
import { Button, Card, CardBody, Spinner } from "@heroui/react";
import { toast } from "sonner";

interface RelatedWord {
  id: number;
  name: string;
  relationType: string;
}

export interface RelatedWordsListProps {
  wordId: number;
  relatedWords: RelatedWord[];
  isLoading: boolean;
  onRelationRemoved: () => void;
}

export default function RelatedWordsList({
  wordId,
  relatedWords,
  isLoading,
  onRelationRemoved,
}: RelatedWordsListProps) {
  const t = useTranslations("Dashboard.WordRelations");
  const [removingId, setRemovingId] = useState<number | null>(null);

  // Mutation to remove a related word
  const removeRelatedWordMutation = api.admin.wordRelations.removeRelatedWord.useMutation({
    onSuccess: () => {
      onRelationRemoved();
      toast.success(t("toast.relationRemovedSuccess"));
      setRemovingId(null);
    },
    onError: (error) => {
      toast.error(t("toast.relationRemovedError", { error: error.message }));
      setRemovingId(null);
    },
  });
  
  // Check if mutation is in progress
  const isMutationInProgress = (id: number) => removeRelatedWordMutation.status === "pending" && removingId === id;

  // Handle removing a related word
  const handleRemoveRelation = (relatedWordId: number) => {
    setRemovingId(relatedWordId);
    removeRelatedWordMutation.mutate({
      wordId,
      relatedWordId,
    });
  };

  // Get relation type display name
  const getRelationTypeDisplay = (relationType: string) => {
    const relationTypes: Record<string, string> = {
      relatedWord: t("relationTypes.relatedWord"),
      antonym: t("relationTypes.antonym"),
      synonym: t("relationTypes.synonym"),
      correction: t("relationTypes.correction"),
      compound: t("relationTypes.compound"),
      see_also: t("relationTypes.seeAlso"),
      turkish_equivalent: t("relationTypes.turkishEquivalent"),
      obsolete: t("relationTypes.obsolete"),
    };

    return relationTypes[relationType] || relationType;
  };

  if (isLoading) {
    return (
      <Card>
        <CardBody className="flex justify-center items-center p-6">
          <Spinner size="md" />
        </CardBody>
      </Card>
    );
  }

  if (relatedWords.length === 0) {
    return (
      <Card>
        <CardBody className="text-center">
          {t("noRelatedWords")}
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="p-0">
        <div className="divide-y">
          {relatedWords.map((word) => (
            <div key={word.id} className="p-4 flex justify-between items-center">
              <div>
                <div className="font-medium">{word.name}</div>
                <div className="text-sm text-secondary">
                  {getRelationTypeDisplay(word.relationType)}
                </div>
              </div>
              <Button
                onPress={() => handleRemoveRelation(word.id)}
                isDisabled={isMutationInProgress(word.id)}
                color="danger"
                variant="light"
                size="sm"
              >
                {isMutationInProgress(word.id) ? (
                  <div className="flex items-center gap-1">
                    <Spinner size="sm" />
                    {t("removing")}
                  </div>
                ) : (
                  t("remove")
                )}
              </Button>
            </div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
}
