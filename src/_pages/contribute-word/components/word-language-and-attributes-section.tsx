"use client";

import React from "react";
import { Controller, Control, FieldErrors } from "react-hook-form";
import { Button, AutocompleteItem, Tooltip } from "@heroui/react";
import { useTranslations } from "next-intl";
import { Plus, FileClock } from "lucide-react";

import { CustomAutocomplete } from "@/src/components/customs/heroui/custom-autocomplete";

export interface Language {
  language_code: string;
  language_en: string;
  language_tr: string;
}

export interface WordAttribute {
  id: number;
  attribute: string;
}

export interface WordLanguageAndAttributesSectionProps {
  control: Control<any>;
  errors: FieldErrors<any>;
  languages?: Language[];
  languagesIsLoading: boolean;
  wordAttributesWithRequested?: WordAttribute[];
  wordAttributesWithRequestedIsLoading: boolean;
  requestedAttributes: string[];
  locale: "en" | "tr";
  onOpenAttributeModal: () => void;
}

export default function WordLanguageAndAttributesSection({
  control,
  errors,
  languages,
  languagesIsLoading,
  wordAttributesWithRequested,
  wordAttributesWithRequestedIsLoading,
  requestedAttributes,
  locale,
  onOpenAttributeModal,
}: WordLanguageAndAttributesSectionProps) {
  const t = useTranslations("ContributeWord");
  const tRequests = useTranslations("Requests");

  // Sort languages alphabetically
  const sortedLanguages = languages
    ? [...languages].sort((a, b) => {
      const aName = locale === "en" ? a.language_en : a.language_tr;
      const bName = locale === "en" ? b.language_en : b.language_tr;
      return aName.localeCompare(bName);
    })
    : [];

  // Sort word attributes alphabetically
  const sortedWordAttributes = wordAttributesWithRequested
    ? [...wordAttributesWithRequested].sort((a, b) => a.attribute.localeCompare(b.attribute))
    : [];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Language */}
      <Controller
        name="languageCode"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <CustomAutocomplete
            {...field}
            classNames={{
              base: "w-full",
            }}
            isLoading={languagesIsLoading}
            label={t("language")}
            placeholder={t("selectLanguage")}
            isInvalid={!!error}
            errorMessage={error?.message}
            items={sortedLanguages.map((lang) => ({
              key: lang.language_code,
              label: locale === "en" ? lang.language_en : lang.language_tr
            }))}
          >
            {sortedLanguages.map((lang) => (
              <AutocompleteItem key={lang.language_code}>
                {locale === "en" ? lang.language_en : lang.language_tr}
              </AutocompleteItem>
            )) || []}
          </CustomAutocomplete>
        )}
      />

      {/* Word Attributes */}
      <Controller
        name="attributes"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <CustomAutocomplete
            {...field}
            classNames={{
              base: "w-full",
            }}
            isLoading={wordAttributesWithRequestedIsLoading}
            label={t("attributes")}
            placeholder={t("selectAttributes")}
            isInvalid={!!error}
            errorMessage={error?.message}
            items={sortedWordAttributes.map((attr) => ({
              key: attr.id.toString(),
              label: attr.attribute
            }))}
            endContent={
              <Button
                isIconOnly
                size="sm"
                variant="light"
                onPress={onOpenAttributeModal}
              >
                <Plus className="h-4 w-4" />
              </Button>
            }
          >
            {sortedWordAttributes.map((attr) => (
              <AutocompleteItem
                key={attr.id.toString()}
                endContent={Number(attr.id) < 0 ? (
                  <Tooltip content={tRequests("RequestedAttributeByYou")}>
                    <FileClock className="text-warning" />
                  </Tooltip>
                ) : ""}
              >
                {attr.attribute}
              </AutocompleteItem>
            )) || []}
          </CustomAutocomplete>
        )}
      />
    </div>
  );
}
