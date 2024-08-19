import { EditWordForm } from '@/types'
import { Select, Selection, SelectItem } from '@nextui-org/react'
import React from 'react'
import { Control, Controller, UseFormSetValue } from 'react-hook-form'

export default function AttributesInput({
    control,
    attributes,
    selectedAttributes,
    setFieldValue,
    index,
}: {
    control: Control<EditWordForm>
    attributes: {
        id: string,
        attribute: string
    }[]
    selectedAttributes: string[]
    setFieldValue: UseFormSetValue<EditWordForm>
    index: number
}) {
    const [values, setValues] = React.useState<Selection>(new Set(selectedAttributes));
    const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedAttributes = e.target.value.split(",").filter((val) => val)
        setValues(() => new Set(selectedAttributes))
        setFieldValue(`meanings.${index}.attributes`, selectedAttributes)
    };
    return (
        <Controller control={control} name={`meanings.${index}.attributes`} render={({ field }) => (
            <Select
                {...field}
                onChange={handleSelectionChange}
                selectedKeys={values}
                selectionMode='multiple'
            >
                {
                    attributes.map((att) => (
                        <SelectItem key={att.id}>
                            {att.attribute}
                        </SelectItem>
                    ))
                }
            </Select>
        )}
        />
    )
}
