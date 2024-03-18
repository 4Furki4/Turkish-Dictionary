import { WordForm } from '@/types';
import { Autocomplete, AutocompleteItem } from '@nextui-org/react';
import React from 'react'
import { Control, Controller, UseFormClearErrors, UseFormGetFieldState, UseFormSetError, UseFormWatch } from 'react-hook-form';

export default function WordRootLanguageInput({
    control,
    watch,
    setError,
    clearErrors,
    getFieldState,
    locale,
    langs,
}: {
    control: Control<WordForm>,
    watch: UseFormWatch<WordForm>,
    setError: UseFormSetError<WordForm>,
    clearErrors: UseFormClearErrors<WordForm>,
    getFieldState: UseFormGetFieldState<WordForm>,
    locale: string,
    langs: any[],
}) {
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
                        return "Language is required when root specified";
                    } else if (!watch("root") && value) {
                        setError("root", {
                            message: "Root is required when language is selected",
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
                    placeholder="You can search for a language"
                    defaultItems={langs}
                    label="Select an language"
                    {...field}
                    onSelectionChange={(item) => {
                        field.onChange(item);
                        clearErrors("language");
                    }}
                    errorMessage={error?.message}
                >
                    {(item) => (
                        <AutocompleteItem key={item.name}>
                            {locale === "en" ? item.name : item.turkishName}
                        </AutocompleteItem>
                    )}
                </Autocomplete>
            )}
        />
    )
}
