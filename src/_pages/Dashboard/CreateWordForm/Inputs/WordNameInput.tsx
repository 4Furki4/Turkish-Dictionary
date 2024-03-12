import { api } from '@/src/trpc/react';
import { WordForm } from '@/types';
import { Input } from '@nextui-org/react';
import React from 'react'
import { Control, Controller, UseFormSetError, UseFormWatch } from 'react-hook-form';

export default function WordNameInput({
    control,
    watch,
    setError,
}: {
    control: Control<WordForm>,
    watch: UseFormWatch<WordForm>,
    setError: UseFormSetError<WordForm>,

}) {
    const wordCheckQuery = api.admin.checkWord.useQuery(watch("name")!, {
        enabled: false,
    });
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
                    label="Name"
                    color="primary"
                    variant="underlined"
                    errorMessage={error?.message}
                    isInvalid={error !== undefined}
                    isRequired={true}
                    onFocusChange={async (isFocused) => {
                        // Check if the word exists, if it does, show a error message
                        const wordInput = watch("name");
                        if (!isFocused && wordInput) {
                            const data = (await wordCheckQuery.refetch()).data;
                            if (data?.wordAlreadyExists) {
                                setError("name", {
                                    message: "Word already exists",
                                });
                            }
                        }
                    }}
                />
            )}
        />
    )
}
