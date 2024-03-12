import { Select, SelectItem } from '@nextui-org/react'
import React from 'react'
import { Controller } from 'react-hook-form'
import { partOfSpeechEnum } from "@/db/schema/part_of_speechs";
export default function MeaningPartOfSpeechInput({
    index,
    control,
}: {
    index: number,
    control: any,
}) {
    return (
        <Controller
            name={`meanings.${index}.partOfSpeech`}
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
                >
                    {partOfSpeechEnum.enumValues.map((key) => (
                        <SelectItem key={key} value={key}>
                            {key}
                        </SelectItem>
                    ))}
                </Select>
            )}
        />
    )
}
