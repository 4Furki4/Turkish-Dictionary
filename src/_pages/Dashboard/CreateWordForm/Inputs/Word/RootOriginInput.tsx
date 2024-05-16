import { WordForm } from '@/types';
import { Input } from '@nextui-org/react';
import { useTranslations } from 'next-intl';
import React from 'react'
import { Control, Controller, UseFormClearErrors, UseFormGetFieldState, UseFormSetError, UseFormWatch } from 'react-hook-form';

export default function WordRootOriginInput({
    control,
    watch,
    setError,
    clearErrors,
    getFieldState,
}: {
    control: Control<WordForm>,
    watch: UseFormWatch<WordForm>,
    setError: UseFormSetError<WordForm>,
    clearErrors: UseFormClearErrors<WordForm>,
    getFieldState: UseFormGetFieldState<WordForm>
}) {
    const t = useTranslations('LanguageAndRootInput')
    return (
        <Controller
            control={control}
            name="root"
            rules={{
                validate: (value) => {
                    if (
                        watch("language") &&
                        !value &&
                        getFieldState("root").isTouched
                    ) {
                        return t("rootInputError");
                    } else if (!watch("language") && value) {
                        setError("language", {
                            message: t("languageInputError")
                        });
                        return true;
                    } else {
                        clearErrors("language");
                        return true;
                    }
                },
            }}
            render={({ field, fieldState: { error } }) => (
                <Input
                    placeholder="Type the root word"
                    label="Root"
                    color="primary"
                    variant="underlined"
                    errorMessage={error?.message}
                    isInvalid={error !== undefined}
                    {...field}
                />
            )}
        />
    )
}
