import { WordForm } from '@/types'
import { Input } from '@nextui-org/react'
import clsx from 'clsx'
import React from 'react'
import { Control, Controller, UseFormWatch } from 'react-hook-form'

export default function MeaningExampleSentenceInput({
    index,
    control,
    watch,
}: {
    index: number,
    control: Control<WordForm>,
    watch: UseFormWatch<WordForm>,
}) {
    return (
        <Controller
            name={`meanings.${index}.example.sentence`}
            control={control}
            rules={{
                validate: (sentence => {
                    const authorFormName = `meanings.${index}.example.author` as const
                    const author = watch(authorFormName)
                    if (author && !sentence) return "Example sentence is required when author is selected!"
                    else return true
                })
            }}
            render={({ field, formState: { errors } }) => (
                <>
                    <Input
                        {...field}
                        radius='sm'
                        label="Example Sentence"
                        labelPlacement='outside'
                        isInvalid={!!errors?.meanings?.[index]?.example?.sentence}
                        errorMessage={errors.meanings?.[index]?.example?.sentence?.message}
                        description="Example sentence is optional but required when example author is specified."
                    />
                </>
            )}
        />
    )
}
