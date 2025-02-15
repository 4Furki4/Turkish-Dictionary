import React from 'react'
import { Control, Controller, UseFormSetValue } from 'react-hook-form'
import { Select, Selection, SelectItem } from '@heroui/react'
import { MeaningEditRequestForm } from '../MeaningsEditRequest'

export default function MeaningAttributesInput({ control, meaningAttributes, meaningAttributesIsLoading, setFieldValue, selectedAttributes, index }:
    {
        control: Control<MeaningEditRequestForm>,
        meaningAttributes: {
            id: number;
            attribute: string;
        }[] | undefined,
        meaningAttributesIsLoading: boolean,
        setFieldValue: UseFormSetValue<MeaningEditRequestForm>,
        selectedAttributes: string[]
        index: number
    }) {
    const [values, setValues] = React.useState<Selection>(new Set(selectedAttributes));
    const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedAttributes = e.target.value.split(",").filter((val) => val)
        setValues(() => new Set(selectedAttributes))
        setFieldValue(`meanings.${index}.attributes`, selectedAttributes)
    };
    return (
        <Controller
            name={`meanings.${index}.attributes`}
            control={control}
            render={({ field, fieldState: { error } }) => (
                <Select
                    as={'div'}
                    {...field}
                    items={meaningAttributes || []}
                    radius='sm'
                    label="Attributes"
                    labelPlacement='outside'
                    placeholder='You can select an attribute for this meaning'
                    selectionMode="multiple"
                    isLoading={meaningAttributesIsLoading}
                    selectedKeys={values}
                    onChange={handleSelectionChange}
                    isInvalid={!!error}
                    errorMessage={error?.message}
                    className="w-full"
                >
                    {(attr) => (
                        <SelectItem key={attr.id.toString()} value={attr.id.toString()}>
                            {attr.attribute}
                        </SelectItem>
                    )}
                </Select>
            )}
        />
    )
}
