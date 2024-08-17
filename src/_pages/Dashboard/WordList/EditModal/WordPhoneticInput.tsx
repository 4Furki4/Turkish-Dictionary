import { EditWordForm } from '@/types'
import { Input } from '@nextui-org/react'
import React from 'react'
import { Control, Controller } from 'react-hook-form'

export default function WordPhoneticInput({
    control
}: {
    control: Control<EditWordForm>
}) {
    return (
        <Controller
            control={control}
            name="phonetic"
            render={({ field, fieldState: { error } }) => (
                <Input
                    {...field}
                    classNames={{
                        base: "h-10",
                    }}
                    label="Phonetic"
                    color="primary"
                    variant="underlined"
                />
            )}
        />
    )
}
