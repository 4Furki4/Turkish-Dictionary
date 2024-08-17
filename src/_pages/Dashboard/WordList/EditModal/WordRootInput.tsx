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
                    classNames={{
                        base: "h-10",
                    }}
                    // placeholder="Type the root word"
                    label="Root"
                    color="primary"
                    variant="underlined"
                    {...field}
                />
            )}
        />
    )
}