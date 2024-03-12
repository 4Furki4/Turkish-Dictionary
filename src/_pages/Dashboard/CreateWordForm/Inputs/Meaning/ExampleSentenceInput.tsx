import { WordForm } from '@/types'
import { Input } from '@nextui-org/react'
import React from 'react'
import { Control, Controller } from 'react-hook-form'

export default function MeaningExampleSentenceInput({
    index,
    control,
}: {
    index: number,
    control: Control<WordForm>,
}) {
    return (
        <Controller
            name={`meanings.${index}.example.sentence`}
            control={control}
            render={({ field }) => (
                <Input
                    {...field}
                    label="Example Sentence"
                    color="primary"
                    variant="underlined"
                    description="Example sentence is optional but required when example author is specified."
                />
            )}
        />
    )
}
