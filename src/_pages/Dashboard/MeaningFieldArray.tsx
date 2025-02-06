import React, { useMemo } from 'react'
import { Control, FormState, UseFormClearErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { WordForm } from '@/types';
import { Button, Card, CardBody } from '@heroui/react';
import WordMeaningInput from './CreateWordForm/Inputs/Meaning/WordMeaningInput';
import MeaningPartOfSpeechInput from './CreateWordForm/Inputs/Meaning/PartOfSpeechInput';
import MeaningAttributesInput from './CreateWordForm/Inputs/Meaning/AttributesInput';
import MeaningExampleSentenceInput from './CreateWordForm/Inputs/Meaning/ExampleSentenceInput';
import MeaningExampleAuthorInput from './CreateWordForm/Inputs/Meaning/ExampleAuthorInput';
import MeaningImageInput from './CreateWordForm/Inputs/Meaning/ImageInput';
import { api } from '@/src/trpc/react';

export default function MeaningFieldArray({
    fields,
    control,
    clearErrors,
    watch,
    setValue,
    remove,
    formState,
    setImagePreviewUrls,
    imagePreviewUrls
}: {
    fields: {
        id: string;
        [key: string]: any;
    }[];
    control: Control<WordForm>;
    clearErrors: UseFormClearErrors<WordForm>;
    watch: UseFormWatch<WordForm>;
    setValue: UseFormSetValue<WordForm>;
    remove: (index: number) => void;
    formState: FormState<WordForm>;
    setImagePreviewUrls: React.Dispatch<React.SetStateAction<string[]>>;
    imagePreviewUrls: string[];
}) {
    const [meaningAttributes] = api.admin.getMeaningAttributes.useSuspenseQuery()
    const [authors] = api.admin.getExampleSentenceAuthors.useSuspenseQuery()
    const [partOfSpeeches] = api.admin.getPartOfSpeeches.useSuspenseQuery()

    const renderMeaningFields = useMemo(() => {
        return fields.map((field, index) => (
            <div key={field.id} className="w-full">
                <h2 className="text-center text-fs-1">Meanings</h2>
                <Card className="mb-4 rounded-sm">
                    <CardBody>
                        <WordMeaningInput index={index} control={control} />
                        <div className="sm:grid sm:grid-cols-2 gap-2">
                            <MeaningPartOfSpeechInput index={index} control={control} partOfSpeeches={partOfSpeeches} />
                            <MeaningAttributesInput index={index} control={control} meaningAttributes={meaningAttributes} setFieldValue={setValue} />
                            <MeaningExampleSentenceInput index={index} control={control} watch={watch} />
                            <MeaningExampleAuthorInput index={index} control={control} defaultExampleSentenceAuthors={authors} clearErrors={clearErrors} watch={watch} setFieldValue={setValue} />
                        </div>
                        <div className="grid gap-2">
                            <MeaningImageInput index={index} control={control} formState={formState} clearErrors={clearErrors} field={field} setImagePreviewUrls={setImagePreviewUrls} imagePreviewUrls={imagePreviewUrls} />
                        </div>
                        <Button className="rounded-sm" onPress={() => remove(index)}>Remove Meaning</Button>
                    </CardBody>
                </Card>
            </div>
        ));
    }, [fields, control, partOfSpeeches, meaningAttributes, authors, clearErrors, watch, setValue, remove, formState, setImagePreviewUrls, imagePreviewUrls]);
    return (
        <div>
            {renderMeaningFields}
        </div>
    )
}
