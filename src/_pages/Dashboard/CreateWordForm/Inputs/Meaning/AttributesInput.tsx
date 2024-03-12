import { WordForm } from '@/types'
import { Autocomplete, AutocompleteItem } from '@nextui-org/react'
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
            render={({ field, fieldState: { error } }) => (
                <Autocomplete label={'Attribute'} defaultItems={meaningAttributes ?? []}>
                    {(item) => (
                        <AutocompleteItem key={item.attribute} className="capitalize">
                            {item && item.attribute}
                        </AutocompleteItem>
                    )}
                </Autocomplete>
            )}
        />
    )
}
