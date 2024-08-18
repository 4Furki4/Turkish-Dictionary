import { PartOfSpeech } from '@/db/schema/part_of_speechs'
import { EditWordForm } from '@/types'
import { Select, Selection, SelectItem } from '@nextui-org/react'
import React from 'react'
import { Control, Controller, UseFormSetValue } from 'react-hook-form'

export default function PartOfSpeechInput({
    control,
    index,
    partOfSpeeches,
    selectedPartOfSpeechId,
    setFieldValue
}: {
    control: Control<EditWordForm>,
    index: number,
    partOfSpeeches: {
        id: string;
        partOfSpeech: PartOfSpeech;
    }[],
    selectedPartOfSpeechId: string
    setFieldValue: UseFormSetValue<EditWordForm>
}) {
    const [value, setValue] = React.useState<Selection>(new Set([selectedPartOfSpeechId.toString()]));
    const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedAttribute = e.target.value
        setValue(() => new Set([selectedAttribute]))
        setFieldValue(`meanings.${index}.partOfSpeechId`, selectedAttribute)
    };
    return (
        <Controller control={control} name={`meanings.${index}.partOfSpeechId`}
            render={({ field }) => (
                <Select items={partOfSpeeches} selectionMode='single' {...field} selectedKeys={value} onChange={handleSelectionChange}>
                    {partOfSpeeches.map((key) => (
                        <SelectItem key={key.id} value={key.partOfSpeech}>
                            {key.partOfSpeech}
                        </SelectItem>
                    ))}
                </Select>
            )} />
    )
}
