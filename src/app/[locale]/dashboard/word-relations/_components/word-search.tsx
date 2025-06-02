"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useDebounce } from "@/src/hooks/use-debounce";
import { api } from "@/src/trpc/react";
import { Input, Spinner, Card, CardBody, Button } from "@heroui/react";

export interface WordSearchProps {
  onWordSelect: (id: number, name: string) => void;
}

export default function WordSearch({ onWordSelect }: WordSearchProps) {
  const t = useTranslations("Dashboard.WordRelations");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Search words based on the query
  const { data: searchResults, isLoading } = api.admin.wordRelations.searchWords.useQuery(
    { query: debouncedQuery, limit: 10 },
    { enabled: debouncedQuery.length > 1 }
  );

  return (
    <div>
      <Input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="w-full"
        endContent={isLoading ? <Spinner size="sm" /> : null}
      />

      {debouncedQuery.length > 1 && searchResults && searchResults.length > 0 && (
        <div className="mt-4">
          <h3 className="text-sm font-medium mb-2">{t("searchResults")}</h3>
          <Card>
            <CardBody className="p-0 max-h-60 overflow-y-auto">
              <div className="divide-y">
                {searchResults.map((word) => (
                  <Button 
                    key={word.id} 
                    className="w-full justify-start" 
                    variant="light" 
                    onPress={() => onWordSelect(word.id, word.name)}
                  >
                    <div className="text-left">
                      <div className="font-medium">{word.name}</div>
                      <div className="text-sm">ID: {word.id}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </CardBody>
          </Card>
        </div>
      )}

      {debouncedQuery.length > 1 && searchResults && searchResults.length === 0 && (
        <div className="mt-4">
          <Card>
            <CardBody className="text-center">
              {t("noResultsFound")}
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
