"use client"
import AddMeaningAttributeModal from '@/src/components/customs/Modals/AddMeaningAttribute';
import { api } from '@/src/trpc/react';
import { WordForm } from '@/types'
import { Button, Select, Selection, SelectItem, useDisclosure } from '@nextui-org/react'
import { Plus, X } from 'lucide-react';
import React from 'react'
import { Control, Controller, UseFormSetValue } from 'react-hook-form'

export default function MeaningAttributesInput({
    index,
    control,
    meaningAttributes,
    setFieldValue
}: {
    index: number,
    control: Control<WordForm>,
    meaningAttributes: {
        id: number;
        attribute: string;
    }[],
    setFieldValue: UseFormSetValue<WordForm>
}) {
    {/* TODO: LET THEM SELECT THE ADDED ATTRIBUTES OR ADD NEW ONE */ }
    const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure()
    const [values, setValues] = React.useState<Selection>(new Set([]));
    const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedAttributes = e.target.value.split(",").filter((val) => val)
        setValues(() => new Set(selectedAttributes))
        setFieldValue(`meanings.${index}.attributes`, selectedAttributes)
    };
    const { data, isLoading } = api.admin.getMeaningAttributes.useQuery(undefined, {
        initialData: meaningAttributes
    })
    return (
        <>
            <AddMeaningAttributeModal isOpen={isOpen} onOpenChange={onOpenChange} onClose={onClose} />
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
                    <Select {...field}
                        as={'div'}
                        tabIndex={0}
                        radius='sm'
                        label="Attributes"
                        classNames={{
                            trigger: "pl-1",
                        }}
                        labelPlacement='outside'
                        description="Attribute is optional"
                        placeholder='Select a meaning attribute'
                        selectionMode='multiple'
                        onChange={handleSelectionChange}
                        isLoading={isLoading}
                        selectedKeys={values}
                        startContent={(
                            <Button
                                variant='light'
                                isIconOnly
                                color='danger'
                                onPress={() => {
                                    setValues(new Set([]));
                                    setFieldValue(`meanings.${index}.attributes`, [])
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
                            // color='primary'
                            >
                                <div className='sr-only'>
                                    Add new word attribute
                                </div>
                                <Plus></Plus>
                            </Button>
                        )}
                    >
                        {data.map((attribute) => (
                            <SelectItem key={attribute.id}>
                                {attribute.attribute}
                            </SelectItem>
                        ))}
                    </Select>
                )}
            />
        </>
    )
}
