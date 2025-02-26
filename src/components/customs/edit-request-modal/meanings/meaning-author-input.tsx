import { Control, Controller } from 'react-hook-form'
import { Select, SelectItem } from '@heroui/react'
import { MeaningEditRequestForm } from '../meanings-edit-request'
export default function MeaningAuthorInput({ control, meaningAuthors, meaningAuthorsIsLoading }:
    {
        control: Control<MeaningEditRequestForm>,
        meaningAuthors: {
            id: string;
            name: string;
        }[] | undefined,
        meaningAuthorsIsLoading: boolean
    }) {
    return (
        <Controller
            name={`author_id`}
            control={control}
            render={({ field, fieldState: { error } }) => (
                <Select
                    {...field}
                    items={meaningAuthors || []}
                    isLoading={meaningAuthorsIsLoading}
                    selectedKeys={field.value?.toString() ? new Set([field.value?.toString()]) : new Set()}
                    label="Sentence Author"
                    placeholder="Select an author"
                    isInvalid={!!error}
                    errorMessage={error?.message}
                    className="w-full"
                >
                    {(author) => (
                        <SelectItem key={author.id.toString()} value={author.id.toString()}>
                            {author.name}
                        </SelectItem>
                    )}
                </Select>
            )}
        />
    )
}
