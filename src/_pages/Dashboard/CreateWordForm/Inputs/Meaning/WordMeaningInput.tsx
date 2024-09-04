"use client"
import { WordForm } from '@/types'
import { Input } from '@nextui-org/react'
import React from 'react'
import { Control, Controller } from 'react-hook-form'

export default function WordMeaningInput({
    index,
    control,

}: {
    index: number,
    control: Control<WordForm>,
}) {
    return (
        <Controller
            name={`meanings.${index}.meaning`}
            control={control}
            rules={{
                required: {
                    value: true,
                    message: "Meaning is required",
                },
            }}
            render={({ field, fieldState: { error } }) => (
                <Input
                    {...field}
                    radius='sm'
                    label="Meaning"
                    labelPlacement='outside'
                    description="Meaning is required."
                    isRequired
                    errorMessage={error?.message}
                    isInvalid={error !== undefined}
                />
            )}
        />
    )
}
