import { EditWordForm } from '@/types'
import { Input } from '@nextui-org/react'
import React from 'react'
import { Control, Controller } from 'react-hook-form'

export default function WordRootInput({
    control
}: {
    control: Control<EditWordForm>
}) {
    return (
        <Controller
            control={control}
            name="root"
            render={({ field, fieldState: { error } }) => (
                <Input
                    // placeholder="Type the root word"
                    label="Root"
                    labelPlacement='outside'
                    radius='sm'
                    placeholder={`You can enter the word's root here`}
                    isInvalid={error !== undefined}
                    errorMessage={error?.message}
                    {...field}
                />
            )}
        />
    )
}
