"use client"
import { WordForm } from '@/types'
import { Input } from '@nextui-org/react'
import React from 'react'
import { Control, Controller } from 'react-hook-form'

export default function WordPrefixInput({
    control
}: {
    control: Control<WordForm>
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
                    description="Prefix is optional"
                />
            )}
        />
    )
}
