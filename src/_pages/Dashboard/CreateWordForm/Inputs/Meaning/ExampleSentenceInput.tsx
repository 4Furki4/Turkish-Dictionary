import { WordForm } from '@/types'
import { Input } from '@nextui-org/react'
import clsx from 'clsx'
import React from 'react'
import { Control, Controller, FieldErrors, UseFormClearErrors, UseFormGetFieldState, UseFormSetError, UseFormWatch } from 'react-hook-form'

export default function MeaningExampleSentenceInput({
    index,
    control,
    errors,
    getFieldState,
    setError,
    clearErrors,
    watch,
}: {
    index: number,
    control: Control<WordForm>,
    errors: FieldErrors<WordForm>
    getFieldState: UseFormGetFieldState<WordForm>,

    setError: UseFormSetError<WordForm>,
    clearErrors: UseFormClearErrors<WordForm>,
    watch: UseFormWatch<WordForm>,
}) {
    return (
        <Controller
            name={`meanings.${index}.example.sentence`}
            control={control}
            rules={{
                validate: (value) => {
                    const exampleSentence = `meanings.${index}.example.sentence` as const
                    const quoteAuthor = `meanings.${index}.example.author` as const
                    if (
                        !value &&
                        !!watch(quoteAuthor) &&
                        getFieldState(exampleSentence).isTouched
                    ) {
                        return "Language is required when root specified";
                    } else if (!watch(quoteAuthor) && value) {
                        setError(quoteAuthor, {
                            message: "Example sentence is required when author is selected",
                        });
                        return true;
                    } else {
                        clearErrors(quoteAuthor);
                        return true;
                    }
                },
            }}
            render={({ field }) => (
                <>
                    <Input
                        {...field}
                        radius='sm'
                        label="Example Sentence"
                        labelPlacement='outside'
                        isInvalid={!!errors?.meanings?.[index]?.example?.sentence}
                        classNames={{
                            description: clsx({
                                'text-danger ease-out duration-200': errors?.meanings?.[index]?.example?.sentence
                            })
                        }}
                        description="Example sentence is optional but required when example author is specified."
                    />
                </>
            )}
        />
    )
}
