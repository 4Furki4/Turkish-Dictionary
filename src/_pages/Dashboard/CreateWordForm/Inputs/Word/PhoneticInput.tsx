import { WordForm } from '@/types'
import { Input } from '@nextui-org/react'
import React from 'react'
import { Control, Controller } from 'react-hook-form'

export default function WordPhoneticInput({
    control
}: {
    control: Control<WordForm>
}) {
    return (
        <Controller
            control={control}
            name="phonetic"
            render={({ field, fieldState: { error } }) => (
                <Input
                    {...field}
                    label="Phonetic"
                    color="primary"
                    variant="underlined"
                    description="Phonetics is optional"
                />
            )}
        />
    )
}
