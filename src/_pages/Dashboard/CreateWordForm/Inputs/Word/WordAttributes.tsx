"use client"
import { api } from '@/src/trpc/react'
import { WordForm } from '@/types'
import { Button, Select, Selection, SelectItem } from '@nextui-org/react'
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
    const [value, setValue] = React.useState<Selection>(new Set([]));

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
                        trigger: "pl-1 h-12 min-h-12",
                    }}
                    placeholder='Select an attribute...'
                    as={"div"}
                    selectedKeys={value}
                    onSelectionChange={setValue}
                    isLoading={isLoading || isFetching || isRefetching}
                    isInvalid={error !== undefined} errorMessage={error?.message}
                    {...field}
                    startContent={(
                        <Button
                            variant='light'
                            isIconOnly
                            color='danger'
                            onPress={() => { setValue(new Set([])) }}
                        >
                            <X aria-description='Reset all selected values button' />
                            <div className='sr-only'>
                                Reset selected values
                            </div>
                        </Button>

                    )}
                    endContent={(
                        <Button
                            isIconOnly
                            onPress={onOpen}
                            color='primary'
                        >
                            <Plus></Plus>
                            <div className='sr-only'>
                                Add new word attribute
                            </div>
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
