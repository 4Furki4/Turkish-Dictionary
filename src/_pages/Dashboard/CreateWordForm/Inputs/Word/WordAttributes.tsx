"use client"
import { api } from '@/src/trpc/react'
import { WordForm } from '@/types'
import { Button, Select, SelectItem } from '@nextui-org/react'
import { Plus, X } from 'lucide-react'
import React from 'react'
import { Control, Controller } from 'react-hook-form'

export default function WordAttributesInput({
    control,
    onOpen
}: {
    control: Control<WordForm>,
    onOpen: () => void
}) {
    const { data: wordAttributes, isLoading, isFetching, isRefetching } = api.admin.getWordAttributes.useQuery()
    return (
        <Controller
            name={`attributes`}
            control={control}
            rules={{
                min: {
                    value: 1,
                    message: "Please select at least one attribute"
                }
            }}
            render={({ field, fieldState: { error } }) => (
                <Select
                    classNames={{
                        trigger: "pl-0"
                    }}
                    placeholder='Select an attribute...'
                    as={"div"}
                    isLoading={isLoading || isFetching || isRefetching}
                    isInvalid={error !== undefined} errorMessage={error?.message}
                    {...field}
                    startContent={(
                        <Button
                            variant='light'
                            radius='full'
                            isIconOnly
                            color='danger'
                            onPress={() => { }} //TODO: implement removing all selected options when pressed on X on the left.s
                        >
                            <X />
                        </Button>

                    )}
                    endContent={(
                        <Button
                            isIconOnly
                            onPress={onOpen}
                            color='primary'
                        >
                            <Plus></Plus>
                        </Button>
                    )}
                    selectionMode='multiple'>
                    {wordAttributes?.map((wordAttribute => (
                        <SelectItem key={wordAttribute.id}>
                            {wordAttribute.attribute}
                        </SelectItem>
                    ))) ?? []}
                </Select>
            )
            }
        />
    )
}
