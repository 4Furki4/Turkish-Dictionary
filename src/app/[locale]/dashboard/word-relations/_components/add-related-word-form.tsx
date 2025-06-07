"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { api } from "@/src/trpc/react";
import { useDebounce } from "@/src/hooks/use-debounce";
import { Button, Card, CardBody, Input, Select, SelectItem, Spinner } from "@heroui/react";
import { toast } from "sonner";

export interface AddRelatedWordFormProps {
  wordId: number;
  onSuccess: () => void;
}

export default function AddRelatedWordForm({
  wordId,
  onSuccess,
}: AddRelatedWordFormProps) {
  const t = useTranslations("Dashboard.WordRelations");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedWordId, setSelectedWordId] = useState<number | null>(null);
  const [selectedWordName, setSelectedWordName] = useState<string>("");
  const [relationType, setRelationType] = useState<string>("relatedWord");
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Search words based on the query, excluding the current word
  const { data: searchResults, isLoading } = api.admin.wordRelations.searchWords.useQuery(
    { 
      query: debouncedQuery, 
      excludeWordId: wordId,
      limit: 10 
    },
    { enabled: debouncedQuery.length > 1 }
  );

  // Mutation to add a related word
  const addRelatedWordMutation = api.admin.wordRelations.addRelatedWord.useMutation({
    onSuccess: () => {
      onSuccess();
      toast.success(t("toast.relationAddedSuccess"));
      setSearchQuery("");
      setSelectedWordId(null);
      setSelectedWordName("");
    },
    onError: (error) => {
      toast.error(t("toast.relationAddedError", { error: error.message }));
    },
  });
  
  // Check if mutation is in progress
  const isMutationLoading = addRelatedWordMutation.status === "pending";

  // Handle word selection
  const handleWordSelect = (id: number, name: string) => {
    setSelectedWordId(id);
    setSelectedWordName(name);
    setSearchQuery("");
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedWordId) {
      addRelatedWordMutation.mutate({
        wordId,
        relatedWordId: selectedWordId,
        relationType,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Relation type selection */}
      <div>
        <label className="block text-sm font-medium mb-1">
          {t("relationType")}
        </label>
        <Select
          selectedKeys={[relationType]}
          onSelectionChange={(keys) => {
            // Extract the first key from the Set and convert to string
            const selectedKey = Array.from(keys)[0];
            setRelationType(selectedKey?.toString() || "relatedWord");
          }}
          className="w-full"
        >
          <SelectItem key="relatedWord">{t("relationTypes.relatedWord")}</SelectItem>
          <SelectItem key="antonym">{t("relationTypes.antonym")}</SelectItem>
          <SelectItem key="synonym">{t("relationTypes.synonym")}</SelectItem>
          <SelectItem key="correction">{t("relationTypes.correction")}</SelectItem>
          <SelectItem key="compound">{t("relationTypes.compound")}</SelectItem>
          <SelectItem key="see_also">{t("relationTypes.seeAlso")}</SelectItem>
          <SelectItem key="turkish_equivalent">{t("relationTypes.turkishEquivalent")}</SelectItem>
          <SelectItem key="obsolete">{t("relationTypes.obsolete")}</SelectItem>
        </Select>
      </div>

      {/* Word search */}
      <div>
        <label className="block text-sm font-medium mb-1">
          {t("searchWord")}
        </label>
        <Input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full"
          endContent={isLoading ? <Spinner size="sm" /> : null}
        />

        {/* Search results */}
        {debouncedQuery.length > 1 && searchResults && searchResults.length > 0 && (
          <Card className="mt-2">
            <CardBody className="p-0 max-h-40 overflow-y-auto">
              <div className="divide-y">
                {searchResults.map((word) => (
                  <Button
                    key={word.id}
                    className="w-full justify-start"
                    variant="light"
                    onPress={() => handleWordSelect(word.id, word.name)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{word.name}</div>
                      <div className="text-xs text-secondary">ID: {word.id}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {debouncedQuery.length > 1 && searchResults && searchResults.length === 0 && (
          <Card className="mt-2">
            <CardBody className="text-center text-sm">
              {t("noResultsFound")}
            </CardBody>
          </Card>
        )}
      </div>

      {/* Selected word */}
      {selectedWordId && (
        <Card>
          <CardBody className="border-2 border-primary">
            <div className="text-sm font-medium">{t("selectedWord")}:</div>
            <div className="font-bold text-primary">{selectedWordName}</div>
          </CardBody>
        </Card>
      )}

      {/* Submit button */}
      <div>
        <Button
          type="submit"
          isDisabled={!selectedWordId || isMutationLoading}
          color="primary"
          className="w-full"
        >
          {isMutationLoading ? (
            <div className="flex items-center justify-center gap-2">
              <Spinner size="sm" />
              {t("adding")}
            </div>
          ) : (
            t("addRelation")
          )}
        </Button>
      </div>

      {/* Error message */}
      {addRelatedWordMutation.isError && (
        <Card className="bg-danger-50">
          <CardBody className="text-danger text-sm">
            {t("errorAddingRelation")}
          </CardBody>
        </Card>
      )}
    </form>
  );
}
