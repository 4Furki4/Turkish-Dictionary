"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/src/trpc/react";
import { useDebounce } from "@/src/hooks/use-debounce";
import { Button, Card, CardBody, Input, Spinner } from "@heroui/react";
import { toast } from "sonner";

export interface AddRelatedPhraseFormProps {
  wordId: number;
  onSuccess: () => void;
}

export default function AddRelatedPhraseForm({
  wordId,
  onSuccess,
}: AddRelatedPhraseFormProps) {
  const t = useTranslations("Dashboard.WordRelations");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPhraseId, setSelectedPhraseId] = useState<number | null>(null);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Search for phrases
  const searchResults = api.admin.wordRelations.searchWords.useQuery(
    {
      query: debouncedSearchQuery,
      excludeWordId: wordId,
      limit: 5,
    },
    {
      enabled: debouncedSearchQuery.length > 1,
      refetchOnWindowFocus: false,
    }
  );

  // Mutation to add a related phrase
  const addRelatedPhraseMutation = api.admin.wordRelations.addRelatedPhrase.useMutation({
    onSuccess: () => {
      onSuccess();
      toast.success(t("toast.relationAddedSuccess"));
      setSearchQuery("");
      setSelectedPhraseId(null);
    },
    onError: (error) => {
      toast.error(t("toast.relationAddedError", { error: error.message }));
    },
  });

  // Handle adding a related phrase
  const handleAddRelation = () => {
    if (!selectedPhraseId) return;

    addRelatedPhraseMutation.mutate({
      wordId,
      relatedPhraseId: selectedPhraseId,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="phrase-search" className="block text-sm font-medium mb-1">
          {t("searchPhrase")}
        </label>
        <Input
          id="phrase-search"
          type="text"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSelectedPhraseId(null);
          }}
          placeholder={t("searchPlaceholder")}
          className="w-full"
        />
      </div>

      {/* Search Results */}
      {debouncedSearchQuery.length > 1 && (
        <div className="mt-2">
          {searchResults.status === "pending" ? (
            <Card>
              <CardBody className="flex justify-center p-2">
                <Spinner size="sm" />
              </CardBody>
            </Card>
          ) : searchResults.data?.length === 0 ? (
            <Card>
              <CardBody className="text-center text-sm">
                {t("noResultsFound")}
              </CardBody>
            </Card>
          ) : (
            <Card>
              <CardBody className="p-0">
                <div className="divide-y">
                  {searchResults.data?.map((phrase) => (
                    <Button
                      key={phrase.id}
                      className="w-full justify-start"
                      variant="light"
                      color={selectedPhraseId === phrase.id ? "primary" : "default"}
                      onPress={() => setSelectedPhraseId(phrase.id)}
                    >
                      <div className="text-left">
                        <div className="font-medium">{phrase.name}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Selected phrase indicator */}
      {selectedPhraseId && searchResults.data && (
        <Card>
          <CardBody className="border-2 border-primary">
            <div className="text-sm font-medium">{t("selectedPhrase")}:</div>
            <div className="font-bold text-primary">
              {searchResults.data.find(phrase => phrase.id === selectedPhraseId)?.name || ""}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Add Button */}
      <div className="flex justify-end">
        <Button
          onPress={handleAddRelation}
          isDisabled={!selectedPhraseId || addRelatedPhraseMutation.status === "pending"}
          color="primary"
        >
          {addRelatedPhraseMutation.status === "pending" ? (
            <div className="flex items-center gap-2">
              <Spinner size="sm" />
              {t("adding")}
            </div>
          ) : (
            t("addRelation")
          )}
        </Button>
      </div>
    </div>
  );
}
