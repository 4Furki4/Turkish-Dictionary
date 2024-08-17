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
            <Input variant='underlined' placeholder="Word name" {...field} name='word' />
        )} />
    )
}
