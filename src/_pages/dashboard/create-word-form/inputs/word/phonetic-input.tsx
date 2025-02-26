"use client"
import { WordForm } from '@/types'
import { Input } from "@heroui/react"
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
                    radius='sm'
                    label="Phonetic"
                    labelPlacement='outside'
                    description="Phonetics is optional"
                />
            )}
        />
    )
}
