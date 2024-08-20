import { EditWordForm, Language } from '@/types'
import { Autocomplete, AutocompleteItem, Select, SelectItem } from '@nextui-org/react'
import React from 'react'
import { Control, Controller } from 'react-hook-form'

export default function WordLanguageInput({
    control,
    languages,
    selectedLanguage
}: {
    control: Control<EditWordForm>,
    languages: Language[],
    selectedLanguage: string
}) {
    return (
        <Controller name='language' control={control} render={({ field, fieldState }) => (
            <Autocomplete
                radius='sm'
                {...field}
                label="Language"
                labelPlacement='outside'
                placeholder="Select Language"
                defaultSelectedKey={selectedLanguage}
                onSelectionChange={(item) => {
                    field.onChange(item);
                }}
            >
                {languages.map((lang) => (
                    <AutocompleteItem key={lang.language_code} value={lang.language_code}>
                        {lang.language_en}
                        {/* TODO: i18n needed */}
                    </AutocompleteItem>
                ))}
            </Autocomplete>
        )} />
    )
}
