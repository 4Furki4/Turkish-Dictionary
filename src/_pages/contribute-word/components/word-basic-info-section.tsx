"use client";

import React from "react";
import { Controller, Control, FieldErrors } from "react-hook-form";
import { useTranslations } from "next-intl";

import { CustomInput } from "@/src/components/customs/heroui/custom-input";

export interface WordBasicInfoSectionProps {
  control: Control<any>;
  errors: FieldErrors<any>;
}

export default function WordBasicInfoSection({ control, errors }: WordBasicInfoSectionProps) {
  const t = useTranslations("ContributeWord");

  return (
    <div className="space-y-6">
      {/* Word Name */}
      <Controller
        name="name"
        control={control}
        render={({ field, fieldState: { error } }) => (
          <CustomInput
            {...field}
            label={t("wordName")}
            placeholder={t("wordNamePlaceholder")}
            isRequired
            isInvalid={!!error}
            errorMessage={error?.message}
          />
        )}
      />

      {/* Phonetic, Prefix, Root, Suffix Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Phonetic */}
        <Controller
          name="phonetic"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <CustomInput
              {...field}
              label={t("phonetic")}
              placeholder={t("phoneticPlaceholder")}
              isInvalid={!!error}
              errorMessage={error?.message}
            />
          )}
        />

        {/* Prefix */}
        <Controller
          name="prefix"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <CustomInput
              {...field}
              label={t("prefix")}
              placeholder={t("prefixPlaceholder")}
              isInvalid={!!error}
              errorMessage={error?.message}
            />
          )}
        />

        {/* Root */}
        <Controller
          name="root"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <CustomInput
              {...field}
              label={t("root")}
              placeholder={t("rootPlaceholder")}
              isInvalid={!!error}
              errorMessage={error?.message}
            />
          )}
        />

        {/* Suffix */}
        <Controller
          name="suffix"
          control={control}
          render={({ field, fieldState: { error } }) => (
            <CustomInput
              {...field}
              label={t("suffix")}
              placeholder={t("suffixPlaceholder")}
              isInvalid={!!error}
              errorMessage={error?.message}
            />
          )}
        />
      </div>
    </div>
  );
}
