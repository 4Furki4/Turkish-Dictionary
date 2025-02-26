"use client"
import { WordForm } from '@/types';
import { Input } from "@heroui/react";
import React from 'react'
import { Control, Controller } from 'react-hook-form';

export default function WordNameInput({
    control,
}: {
    control: Control<WordForm>,
}) {
    return (
        <Controller
            control={control}
            name="name"
            rules={{
                required: {
                    value: true,
                    message: "Name is required",
                },
            }}
            render={({ field, fieldState: { error } }) => (
                <Input
                    {...field}
                    radius='sm'
                    label="Name"
                    labelPlacement='outside'
                    description="Name is required"
                    errorMessage={error?.message}
                    isInvalid={error !== undefined}
                    isRequired={true}
                />
            )}
        />
    )
}
