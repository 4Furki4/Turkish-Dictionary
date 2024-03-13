import { WordForm } from '@/types'
import { Autocomplete, AutocompleteItem, Chip } from '@nextui-org/react'
import React from 'react'
import { Control, Controller } from 'react-hook-form'

export default function MeaningAttributesInput({
    index,
    control,
    meaningAttributes
}: {
    index: number,
    control: Control<WordForm>,
    meaningAttributes: {
        id: number;
        attribute: string;
    }[]
}) {
    {/* TODO: LET THEM SELECT THE ADDED ATTRIBUTES OR ADD NEW ONE */ }
    return (
        <Controller
            name={`meanings.${index}.attributes`}
            control={control}
            rules={{
                min: {
                    value: 1,
                    message: "Please select at least one attribute"
                }
            }}
            render={({ field, fieldState: { error } }) => (
                <Autocomplete {...field}
                    label={'Attribute'}
                    defaultItems={meaningAttributes ?? []}
                    allowsCustomValue
                    onSelectionChange={(key) => {
                        if (key) {
                            field.onChange(key)
                        }
                    }}
                    onInputChange={(value) => {
                        const item = meaningAttributes.find((attribute) => attribute.attribute === value)
                        if (item) {
                            field.onChange(item.id)
                            return
                        }
                        field.onChange(value)
                    }}
                >
                    {(item) => (
                        <AutocompleteItem key={item.id} className="capitalize">
                            {item && item.attribute}
                        </AutocompleteItem>
                    )}
                </Autocomplete>
            )}
        />
    )
}
