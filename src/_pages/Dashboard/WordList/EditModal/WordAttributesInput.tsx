"use client"
import AddWordAttributeModal from '@/src/components/customs/Modals/AddWordAttribute';
import { EditWordForm } from '@/types'
import { Button, Select, Selection, SelectItem, useDisclosure } from '@nextui-org/react'
import { Plus } from 'lucide-react';
import { Control, Controller } from 'react-hook-form'

export default function WordAttribtesInput({
    control,
    wordAttributes,
    selectedWordAttributes
}: {
    control: Control<EditWordForm>,
    wordAttributes: {
        id: number,
        attribute: string
    }[],
    selectedWordAttributes: {
        attribute_id: number;
        attribute: string;
    }[]
}) {
    const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure()
    const selecetedKeys = selectedWordAttributes.map(wordAttribute => wordAttribute.attribute_id + wordAttribute.attribute)
    return (
        <>
            <AddWordAttributeModal isOpen={isOpen} onOpenChange={onOpenChange} onClose={onClose} />
            <Controller
                name={`attributes`}
                control={control}
                rules={{
                    min: {
                        value: 1,
                        message: "Please select at least one attribute"
                    }
                }}
                render={({ field }) => (
                    <Select
                        items={wordAttributes}
                        as={"div"}
                        {...field}
                        endContent={(
                            <Button
                                isIconOnly
                                onPress={onOpen}
                                color='primary'
                            >
                                <div className='sr-only'>
                                    Add new word attribute
                                </div>
                                <Plus></Plus>
                            </Button>
                        )}
                        placeholder='Please select an attribute'
                        defaultSelectedKeys={selecetedKeys}
                        selectionMode='multiple'>
                        {wordAttributes?.map((wordAttribute => (
                            <SelectItem key={wordAttribute.id + wordAttribute.attribute}>
                                {wordAttribute.attribute}
                            </SelectItem>
                        )))}
                    </Select>
                )}
            />
        </>
    )
}
