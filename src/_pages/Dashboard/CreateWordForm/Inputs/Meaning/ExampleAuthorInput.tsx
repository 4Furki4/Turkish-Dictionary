import AddAuthorModal from '@/src/components/customs/Modals/AddAuthor';
import { WordForm } from '@/types'
import { Button, Select, Selection, SelectItem, useDisclosure } from '@nextui-org/react'
import { Plus } from 'lucide-react';
import React from 'react'
import { Control, Controller, UseFormClearErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'

export default function MeaningxampleSentenceAuthorInput({
    index,
    control,
    defaultExampleSentenceAuthors,
    clearErrors,
    watch,
    setFieldValue
}: {
    index: number,
    control: Control<WordForm>,
    defaultExampleSentenceAuthors: {
        id: string;
        name: string;
    }[],
    clearErrors: UseFormClearErrors<WordForm>,
    watch: UseFormWatch<WordForm>,
    setFieldValue: UseFormSetValue<WordForm>
}) {
    const { isOpen, onOpenChange, onOpen, onClose } = useDisclosure()
    const [value, setValue] = React.useState<Selection>(new Set());
    const handleSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedAuthor = e.target.value
        setValue(() => new Set(selectedAuthor))
        setFieldValue(`meanings.${index}.example.author`, selectedAuthor)
    };
    return (
        <Controller
            control={control} name={`meanings.${index}.example.author`}
            rules={{
                validate: (author) => {
                    const exampleSentenceFormName = `meanings.${index}.example.sentence` as const
                    const exampleSentence = watch(exampleSentenceFormName)
                    if (!author) {
                        clearErrors(exampleSentenceFormName)
                        return true
                    }
                    if (!exampleSentence && author) return "Example sentence is required when author is selected!"
                    return true
                },
            }}

            render={({ field }) => (
                <>
                    <AddAuthorModal isOpen={isOpen} onClose={onClose} onOpenChange={onOpenChange} isDismissable={false} />
                    <Select
                        as={"div"}
                        tabIndex={0}
                        {...field}
                        onChange={handleSelectionChange}
                        selectedKeys={value}
                        selectionMode='single'
                        radius='sm'
                        label="Author"
                        labelPlacement='outside'
                        placeholder='You can select an author for the example sentence'
                        description="Author is optional."
                        endContent={(
                            <Button
                                isIconOnly
                                onPress={onOpen}
                                variant='light'
                            >
                                <div className='sr-only'>
                                    Add new word attribute
                                </div>
                                <Plus></Plus>
                            </Button>
                        )}
                    >
                        {
                            defaultExampleSentenceAuthors.map((att) => (
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
