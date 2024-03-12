import { WordForm } from '@/types'
import { Input } from '@nextui-org/react'
import React from 'react'
import { Control, Controller } from 'react-hook-form'

export default function WordSuffixInput({
    control
}: {
    control: Control<WordForm>
}) {
    return (
        <Controller
            control={control}
            name="suffix"
            render={({ field }) => (
                <Input
                    {...field}
                    label="Suffix"
                    color="primary"
                    variant="underlined"
                    description="Suffix is optional"
                />
            )}
        />
    )
}
