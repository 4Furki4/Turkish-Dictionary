"use client"
import { Select, SelectItem } from "@heroui/react"
import React from 'react'
import { Control, Controller } from 'react-hook-form'
import { WordForm } from '@/types';
export default function MeaningPartOfSpeechInput({
    index,
    control,
    partOfSpeeches
}: {
    index: number,
    control: Control<WordForm>,
    partOfSpeeches: {
        id: number;
        partOfSpeech: string;
    }[]
}) {
    return (
        <Controller
            name={`meanings.${index}.partOfSpeechId`}
            control={control}
            rules={{
                required: {
                    value: true,
                    message: "Part of Speech is required",
                },
            }}

            render={({ field, fieldState: { error, isDirty } }) => (
                <Select
                    label="Part of Speech"
                    labelPlacement='outside'
                    placeholder='Please select a part of speech for this meaning'
                    description="Part of speech is required"
                    isRequired
                    isInvalid={error !== undefined && isDirty}
                    errorMessage={isDirty && error?.message}
                    {...field}
                    onChange={(e) => {
                        field.onChange(parseInt(e.target.value)) // Convert string to number to override react-hook-form behavior
                    }}
                    radius='sm'
                    classNames={{
                        listboxWrapper: 'rounded-sm',
                        popoverContent: 'rounded-sm',
                        base: 'rounded-sm',
                    }}
                >
                    {partOfSpeeches.map((key) => (
                        <SelectItem key={key.id}>
                            {key.partOfSpeech}
                        </SelectItem>
                    ))}
                </Select>
            )}
        />
    )
}
