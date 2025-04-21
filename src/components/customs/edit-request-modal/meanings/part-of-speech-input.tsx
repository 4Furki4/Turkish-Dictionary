import React from 'react'
import { Control, Controller } from 'react-hook-form'
import { Select, SelectItem } from '@heroui/react'
import { MeaningEditRequestForm } from '../meanings-edit-request'
import { useTranslations } from 'next-intl'
export default function PartOfSpeechInput({ control, partOfSpeeches, meaningPartOfSpeechIsLoading }:
    {
        control: Control<MeaningEditRequestForm>,
        partOfSpeeches: {
            id: string;
            partOfSpeech: string;
        }[] | undefined,
        meaningPartOfSpeechIsLoading: boolean
    }) {
    const t = useTranslations()
    return (
        <Controller
            name="part_of_speech_id"
            control={control}
            render={({ field, fieldState: { error } }) => (
                <Select
                    {...field}
                    items={partOfSpeeches || []}
                    selectedKeys={field.value?.toString() ? new Set([field.value?.toString()]) : new Set()}
                    isLoading={meaningPartOfSpeechIsLoading}
                    label={t("PartOfSpeech")}
                    placeholder={t("SelectPartOfSpeech")}
                    isInvalid={!!error}
                    errorMessage={error?.message}
                    className="w-full"
                >
                    {(pos) => (
                        <SelectItem key={pos.id.toString()} >
                            {pos.partOfSpeech}
                        </SelectItem>
                    )}
                </Select>
            )}
        />
    )
}
