import { EditWordForm } from '@/types'
import { Input } from '@nextui-org/react'
import React from 'react'
import { Control, Controller } from 'react-hook-form'

export default function MeaningInput({
    control,
    index
}: {
    control: Control<EditWordForm>,
    index: number
}) {
    return (
        <Controller
            name={`meanings.${index}.meaning`}
            control={control}
            render={({ field }) => (
                <Input {...field} label="Meaning"
                    color="primary"
                    variant="underlined"
                    description="Meaning is required."
                    isRequired
                />
            )}
        />
    )
}
