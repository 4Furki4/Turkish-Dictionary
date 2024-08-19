import { EditWordForm } from '@/types'
import { Input } from '@nextui-org/react'
import React from 'react'
import { Control, Controller } from 'react-hook-form'

export default function ExampleSentenceInput({
    control,
    index
}: {
    control: Control<EditWordForm>,
    index: number
}) {
    return (
        <Controller
            name={`meanings.${index}.exampleSentence`}
            control={control}
            render={({ field }) => (
                <Input label="Example Sentence"
                    color="primary"
                    variant="underlined"
                    {...field}
                />
            )}
        />
    )
}
