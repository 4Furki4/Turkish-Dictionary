"use client"
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
                    radius='sm'
                    label="Suffix"
                    labelPlacement='outside'
                    description="Suffix is optional"
                />
            )}
        />
    )
}
