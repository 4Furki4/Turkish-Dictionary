import AddAuthorModal from '@/src/components/customs/Modals/AddAuthor'
import { EditWordForm } from '@/types'
import { Button, Select, Selection, SelectItem, useDisclosure } from '@nextui-org/react'
import { Plus } from 'lucide-react'
import React from 'react'
import { Control, Controller, UseFormSetValue } from 'react-hook-form'

export default function AuthorInput({
    control,
    authors,
    selectedAuthor,
    setFieldValue,
    index,
}: {
    control: Control<EditWordForm>
    authors: {
        id: string,
        name: string
    }[]
    selectedAuthor: string | undefined
    setFieldValue: UseFormSetValue<EditWordForm>
    index: number
}) {
    const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure()
    const [value, setValue] = React.useState<Selection>(new Set(selectedAuthor));
    const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedAuthor = e.target.value
        setValue(() => new Set(selectedAuthor))
        setFieldValue(`meanings.${index}.authorId`, selectedAuthor)
    };

    return (
        <Controller control={control} name={`meanings.${index}.authorId`} render={({ field }) => (
            <>
                <AddAuthorModal isOpen={isOpen} onClose={onClose} onOpenChange={onOpenChange} isDismissable={false} />
                <Select
                    as={"div"}
                    {...field}
                    onChange={handleSelectionChange}
                    selectedKeys={value}
                    selectionMode='single'
                    radius='sm'
                    label="Author"
                    labelPlacement='outside'
                    placeholder='You can select an author for the example sentence'
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
                    {
                        authors.map((att) => (
                            <SelectItem key={att.id}>
                                {att.name}
                            </SelectItem>
                        ))
                    }
                </Select>
            </>
        )}
        />
    )
}