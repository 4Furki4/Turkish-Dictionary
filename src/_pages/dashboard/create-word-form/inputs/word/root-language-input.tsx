"use client"
import { api } from '@/src/trpc/react';
import { WordForm } from '@/types';
import { Autocomplete, AutocompleteItem } from "@heroui/react";
import { useTranslations } from 'next-intl';
import React from 'react'
import { Control, Controller, UseFormClearErrors, UseFormGetFieldState, UseFormSetError, UseFormWatch } from 'react-hook-form';

export default function WordRootLanguageInput({
    control,
    watch,
    setError,
    clearErrors,
    getFieldState,
    locale,
}: {
    control: Control<WordForm>,
    watch: UseFormWatch<WordForm>,
    setError: UseFormSetError<WordForm>,
    clearErrors: UseFormClearErrors<WordForm>,
    getFieldState: UseFormGetFieldState<WordForm>,
    locale: string,
}) {
    const { data: langs, isLoading, isError, isSuccess, error: fetchError } = api.params.getLanguages.useQuery();
    const t = useTranslations()
    return (
        <Controller
            control={control}
            name="language"
            rules={{
                validate: (value) => {
                    if (
                        !value &&
                        !!watch("root") &&
                        getFieldState("language").isTouched
                    ) {
                        return t("Forms.Root.LanguageInputError");
                    } else if (!watch("root") && value) {
                        setError("root", {
                            message: t("Forms.Root.InputError")
                        });
                        return true;
                    } else {
                        clearErrors("root");
                        return true;
                    }
                },
            }}
            render={({ field, fieldState: { error } }) => (
                <Autocomplete
                    radius='sm'
                    placeholder={t('EnterLanguage')}
                    description={t('Forms.Language.Description')}
                    labelPlacement='outside'
                    isLoading={isLoading}
                    defaultItems={isSuccess ? langs : []}
                    label={t('Language')}
                    onSelectionChange={(item) => {
                        field.onChange(item);
                        clearErrors("language");
                    }}
                    classNames={{
                        listboxWrapper: 'rounded-sm',
                        popoverContent: 'rounded-sm',
                        base: 'rounded-sm',
                    }}
                    errorMessage={isError ? fetchError?.message : error?.message ? error.message : ""}
                    isInvalid={isError || error !== undefined}
                >
                    {(item) => (
                        <AutocompleteItem key={item.language_code}>
                            {locale === "en" ? item.language_en : item.language_tr}
                        </AutocompleteItem>
                    )}
                </Autocomplete>
            )}
        />
    )
}
