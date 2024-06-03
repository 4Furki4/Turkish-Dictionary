import { cn } from '@/src/lib/utils';
import { WordForm } from '@/types'
import { Autocomplete, AutocompleteItem, Input } from '@nextui-org/react'
import clsx from 'clsx';
import React from 'react'
import { Control, Controller, FieldErrors, UseFormClearErrors, UseFormGetFieldState, UseFormSetError, UseFormWatch } from 'react-hook-form'
import { twMerge } from 'tailwind-merge';

export default function MeaningxampleSentenceAuthorInput({
    index,
    control,
    defaultExampleSentenceAuthors,
    getFieldState,
    setError,
    clearErrors,
    watch,
    errors
}: {
    index: number,
    control: Control<WordForm>,
    defaultExampleSentenceAuthors: {
        id: number;
        name: string;
    }[],
    getFieldState: UseFormGetFieldState<WordForm>,

    setError: UseFormSetError<WordForm>,
    clearErrors: UseFormClearErrors<WordForm>,
    watch: UseFormWatch<WordForm>,
    errors: FieldErrors<WordForm>
}) {
    return (
        <Controller
            name={`meanings.${index}.example.author`}
            control={control}
            rules={{
                validate: (value) => {
                    const exampleSentence = `meanings.${index}.example.sentence` as const
                    const quoteAuthor = `meanings.${index}.example.author` as const
                    if (
                        !value &&
                        !!watch(exampleSentence) &&
                        getFieldState(quoteAuthor).isTouched
                    ) {
                        return "Language is required when root specified";
                    } else if (!watch(exampleSentence) && value) {
                        setError(exampleSentence, {
                            message: "Example sentence is required when author is selected",
                        });
                        return true;
                    } else {
                        clearErrors(exampleSentence);
                        return true;
                    }
                },
            }}
            render={({ field }) => (
                <div className='flex flex-col gap-1 text-fs--2'>
                    <Autocomplete {...field} label={'Quote Sentence Author'}
                        allowsCustomValue
                        defaultItems={defaultExampleSentenceAuthors}
                        onSelectionChange={(key) => {
                            if (key) {
                                field.onChange(key)
                            }
                        }}
                        radius='sm'
                        classNames={{
                            listboxWrapper: 'rounded-sm',
                            popoverContent: 'rounded-sm',
                            base: 'rounded-sm',
                        }}
                        onInputChange={(value) => {
                            const author = defaultExampleSentenceAuthors.find((attribute) => attribute.name === value)
                            if (author) {
                                field.onChange(author.id)
                                return
                            }
                            field.onChange(value)
                        }}
                    >
                        {(item) => (
                            <AutocompleteItem key={item.id} className="capitalize">
                                {item && item.name}
                            </AutocompleteItem>
                        )}
                    </Autocomplete>
                    <span className={cn('text-danger transition-opacity ease-out duration-200 opacity-0', {
                        'opacity-100': errors?.meanings?.[index]?.example?.author?.message
                    })}>
                        {
                            errors?.meanings?.[index]?.example?.author?.message || ''
                        }&nbsp;
                    </span>
                </div>
            )}
        />
    )
}
