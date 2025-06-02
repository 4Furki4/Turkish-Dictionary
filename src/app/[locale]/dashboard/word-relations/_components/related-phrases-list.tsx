"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/src/trpc/react";
import { Button, Card, CardBody, Spinner } from "@heroui/react";

export interface RelatedPhrasesListProps {
  wordId: number;
  onRelationRemoved: () => void;
}

export default function RelatedPhrasesList({
  wordId,
  onRelationRemoved,
}: RelatedPhrasesListProps) {
  const t = useTranslations("Dashboard.WordRelations");
  const [removingId, setRemovingId] = useState<number | null>(null);

  // Query to get related phrases
  const relatedPhrasesQuery = api.admin.wordRelations.getRelatedPhrases.useQuery(
    { wordId },
    {
      enabled: !!wordId,
      refetchOnWindowFocus: false,
    }
  );

  // Mutation to remove a related phrase
  const removeRelatedPhraseMutation = api.admin.wordRelations.removeRelatedPhrase.useMutation({
    onSuccess: () => {
      onRelationRemoved();
      setRemovingId(null);
    },
  });
  
  // Check if mutation is in progress
  const isMutationInProgress = (id: number) => 
    removeRelatedPhraseMutation.status === "pending" && removingId === id;

  // Handle removing a related phrase
  const handleRemoveRelation = (relatedPhraseId: number) => {
    setRemovingId(relatedPhraseId);
    removeRelatedPhraseMutation.mutate({
      wordId,
      relatedPhraseId,
    });
  };

  // Loading state
  if (relatedPhrasesQuery.status === "pending") {
    return (
      <Card>
        <CardBody className="flex justify-center items-center p-4">
          <Spinner size="md" />
        </CardBody>
      </Card>
    );
  }

  // Error state
  if (relatedPhrasesQuery.status === "error") {
    return (
      <Card>
        <CardBody className="text-danger">
          {t("errorAddingRelation")}
        </CardBody>
      </Card>
    );
  }

  // Empty state
  if (!relatedPhrasesQuery.data || relatedPhrasesQuery.data.length === 0) {
    return (
      <Card>
        <CardBody className="text-center">
          {t("noRelatedPhrases")}
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="p-0">
        <div className="divide-y">
          {relatedPhrasesQuery.data.map((phrase) => (
            <div
              key={phrase.id}
              className="flex justify-between items-center p-3"
            >
              <div className="flex-1">
                <div className="font-medium">{phrase.name}</div>
              </div>
              <Button
                onPress={() => handleRemoveRelation(phrase.id)}
                isDisabled={isMutationInProgress(phrase.id)}
                color="danger"
                variant="light"
                size="sm"
              >
                {isMutationInProgress(phrase.id) ? (
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
