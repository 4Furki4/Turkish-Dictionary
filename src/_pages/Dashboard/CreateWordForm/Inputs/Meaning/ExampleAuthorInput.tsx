import { WordForm } from '@/types'
import { Input } from '@nextui-org/react'
import React from 'react'
import { Control, Controller } from 'react-hook-form'

export default function MeaningExampleAuthorInput({
    index,
    control,
}: {
    index: number,
    control: Control<WordForm>,
}) {
    {/* TODO: LET THEM SELECT ADDED AUTHORS OR CREATE NEW ONE */ }
    return (
        <Controller
            name={`meanings.${index}.example.author`}
            control={control}
            render={({ field }) => (
                <Input
                    {...field}
                    label="Example Author"
                    color="primary"
                    variant="underlined"
                    description="Example Author is optional."
                />
            )}
        />
    )
}
