"use client"
import AddWordAttributeModal from '@/src/components/customs/Modals/AddWordAttribute'
import { api } from '@/src/trpc/react'
import { WordForm } from '@/types'
import { Button, Select, Selection, SelectItem, useDisclosure } from "@heroui/react"
import { Plus, X } from 'lucide-react'
import React from 'react'
import { Control, Controller, UseFormSetValue } from 'react-hook-form'

export default function WordAttributesInput({
    control,
    setValue: setFieldValue
}: {
    control: Control<WordForm>,
    setValue: UseFormSetValue<WordForm>
}) {
    const [wordAttributes] = api.admin.getWordAttributes.useSuspenseQuery()
    const [values, setValues] = React.useState<Selection>(new Set([]));

    const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedAttributes = e.target.value.split(",")
        setValues(() => new Set(selectedAttributes))
        setFieldValue("attributes", selectedAttributes)
    };
    const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure()
    return (
        <>
            <AddWordAttributeModal isOpen={isOpen} onClose={onClose} onOpenChange={onOpenChange} />
            <Controller
                name={`attributes`}
                control={control}
                render={({ field, fieldState: { error } }) => (
                    <Select
                        classNames={{
                            trigger: "pl-1",
                        }}
                        radius='sm'
                        as={'div'}
                        tabIndex={0}
                        placeholder='Select an attribute...'
                        label='Attribute'
                        labelPlacement='outside'
                        selectedKeys={values}
                        isInvalid={error !== undefined} errorMessage={error?.message}
                        {...field}
                        onChange={handleSelectionChange}
                        startContent={(
                            <Button
                                variant='light'
                                isIconOnly
                                color='danger'
                                onPress={() => {
                                    setValues(new Set([]));
                                    setFieldValue("attributes", [])
                                }}
                            >
                                <X aria-description='Reset all selected values button' />
                                <div className='sr-only'>
                                    Reset selected values
                                </div>
                            </Button>
                        )}
                        endContent={(
                            <Button
                                isIconOnly
                                onPress={onOpen}
                                variant='light'
                            >
                                <Plus></Plus>
                                <div className='sr-only'>
                                    Add new word attribute
                                </div>
                            </Button>
                        )}
                        selectionMode='multiple'>
                        {wordAttributes?.map((wordAttribute => (
                            <SelectItem key={wordAttribute.id}>
                                {wordAttribute.attribute}
                            </SelectItem>
                        ))) ?? []}
                    </Select>
                )
                }
            />
        </>
    )
}
