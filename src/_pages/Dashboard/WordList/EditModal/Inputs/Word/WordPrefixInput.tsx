import { EditWordForm } from '@/types'
import { Input } from '@nextui-org/react'
import React from 'react'
import { Control, Controller } from 'react-hook-form'

export default function WordPrefixInput({
    control
}: {
    control: Control<EditWordForm>
}) {
    return (
        <Controller
            control={control}
            name="prefix"
            render={({ field }) => (
                <Input
                    {...field}
                    radius='sm'
                    label="Prefix"
                    labelPlacement='outside'
                    placeholder='You can enter a prefix for the word here'
                />
            )}
        />
    )
}
