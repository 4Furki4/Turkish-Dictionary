"use client";

import React from "react";
import { Controller, Control, FieldErrors } from "react-hook-form";
import { Button, AutocompleteItem, Tooltip } from "@heroui/react";
import { useTranslations } from "next-intl";
import { Plus, FileClock } from "lucide-react";

import { CustomTextarea } from "@/src/components/customs/heroui/custom-textarea";
import { CustomAutocomplete } from "@/src/components/customs/heroui/custom-autocomplete";

export interface Author {
  id: number;
  name: string;
}

export interface MeaningExampleSectionProps {
  meaningIndex: number;
  control: Control<any>;
  errors: FieldErrors<any>;
  authorsWithRequested?: Author[];
  authorsWithRequestedIsLoading: boolean;
  requestedAuthors: string[];
  onOpenAuthorModal: () => void;
}

export default function MeaningExampleSection({
  meaningIndex,
  control,
  errors,
  authorsWithRequested,
  authorsWithRequestedIsLoading,
  requestedAuthors,
  onOpenAuthorModal,
}: MeaningExampleSectionProps) {
  const t = useTranslations("ContributeWord");
  const tRequests = useTranslations("Requests");

  // Sort authors alphabetically
  const sortedAuthors = authorsWithRequested
    ? [...authorsWithRequested].sort((a, b) => a.name.localeCompare(b.name))
    : [];

  return (
    <div className="space-y-3">
      <h5 className="font-medium text-sm">{t("example")}</h5>

      <Controller
        name={`meanings.${meaningIndex}.example.sentence`}
        control={control}
        render={({ field, fieldState: { error } }) => (
          <CustomTextarea
            {...field}
            label={t("exampleSentence")}
            placeholder={t("exampleSentencePlaceholder")}
            isInvalid={!!error}
            errorMessage={error?.message}
          />
        )}
      />

      <div className="flex items-end gap-2">
        <Controller
          name={`meanings.${meaningIndex}.example.author`}
          control={control}
          render={({ field, fieldState: { error } }) => (
            <CustomAutocomplete
              {...field}
              isLoading={authorsWithRequestedIsLoading}
              as={'div'}
              size="lg"
              classNames={{
                base: "w-full",
              }}
              label={t("exampleAuthor")}
              placeholder={t("exampleAuthorPlaceholder")}
              isInvalid={!!error}
              errorMessage={error?.message}
              items={sortedAuthors.map((author) => ({
                key: author.id.toString(),
                label: author.name
              }))}
              endContent={
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  onPress={onOpenAuthorModal}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              }
            >
              {sortedAuthors.map((author) => (
                <AutocompleteItem
                  key={author.id.toString()}
                  endContent={Number(author.id) < 0 ? (
                    <Tooltip content={tRequests("RequestedAttributeByYou")}>
                      <FileClock className="text-warning" />
                    </Tooltip>
                  ) : ""}
                >
                  {author.name}
                </AutocompleteItem>
              )) || []}
            </CustomAutocomplete>
          )}
        />
      </div>
    </div>
  );
}
