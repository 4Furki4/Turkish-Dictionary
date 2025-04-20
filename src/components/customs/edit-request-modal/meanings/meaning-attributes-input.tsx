import React from 'react'
import { Control, Controller } from 'react-hook-form'
import { Select, SelectItem } from '@heroui/react'
import { MeaningEditRequestForm } from '../meanings-edit-request'

export default function MeaningAttributesInput({ control, meaningAttributes, meaningAttributesIsLoading }:
    {
        control: Control<MeaningEditRequestForm>,
        meaningAttributes: {
            id: string;
            attribute: string;
        }[] | undefined,
        meaningAttributesIsLoading: boolean
    }) {
    return (
        <Controller
            name={`attributes`}
            control={control}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
                <Select
                    as={'div'}
                    items={meaningAttributes || []}
                    radius='sm'
                    label="Attributes"
                    placeholder='You can select an attribute for this meaning'
                    selectionMode="multiple"
                    isLoading={meaningAttributesIsLoading}
                    selectedKeys={new Set(value)}
                    onSelectionChange={(keys) => {
                        onChange(Array.from(keys))
                    }}
                    isInvalid={!!error}
                    errorMessage={error?.message}
                    className="w-full"
                >
                    {(attr) => (
                        <SelectItem key={attr.id.toString()} >
                            {attr.attribute}
                        </SelectItem>
                    )}
                </Select>
            )}
        />
    )
}
