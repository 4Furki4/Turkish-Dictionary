import { Select, SelectItem } from '@nextui-org/react'
import React from 'react'
import { Control, Controller } from 'react-hook-form'
import { PartOfSpeech } from "@/db/schema/part_of_speechs";
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
        partOfSpeech: PartOfSpeech;
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
                    color="primary"
                    variant="underlined"
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
                        <SelectItem key={key.id} value={key.id}>
                            {key.partOfSpeech}
                        </SelectItem>
                    ))}
                </Select>
            )}
        />
    )
}
