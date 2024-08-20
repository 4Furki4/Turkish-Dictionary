import { EditWordForm } from '@/types'
import { Input } from '@nextui-org/react'
import React from 'react'
import { Control, Controller } from 'react-hook-form'

export default function WordNameInput({
    control
}: {
    control: Control<EditWordForm, any>
}) {
    return (
        <Controller name='name' control={control} render={({ field }) => (
            <Input
                {...field}
                radius='sm'
                labelPlacement='outside'
                label="Word name"
                placeholder='You must enter a word name here.'
                isRequired
            />
        )} />
    )
}
