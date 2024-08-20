"use client"
import { api } from '@/src/trpc/react';
import { EditMeaningForm, EditWordForm, Language } from '@/types';
import { Button, ButtonGroup, Card, CardBody, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spinner } from '@nextui-org/react';
import React, { useCallback, useEffect } from 'react'
import { useFieldArray, useForm } from 'react-hook-form';
import WordNameInput from './Inputs/Word/WordNameInput';
import WordLanguageInput from './Inputs/Word/WordLanguageInput';
import WordRootInput from './Inputs/Word/WordRootInput';
import WordPhoneticInput from './Inputs/Word/WordPhoneticInput';
import WordSuffixInput from './Inputs/Word/WordSuffixInput';
import WordPrefixInput from './Inputs/Word/WordPrefixInput';
import MeaningInput from './Inputs/Meaning/MeaningInput';
import PartOfSpeechInput from './Inputs/Meaning/PartOfSpeechInput';
import { PartOfSpeech } from '@/db/schema/part_of_speechs';
import AttributesInput from './Inputs/Meaning/AttributesInput';
import ExampleSentenceInput from './Inputs/Meaning/ExampleSentenceInput';
import AuthorInput from './Inputs/Meaning/AuthorInput';
import WordAttributesInput from './Inputs/Word/WordAttributesInput';
import { BetweenVerticalEnd, BetweenVerticalStart, X } from 'lucide-react';


export default function EditWordModal({
    isOpen,
    onOpenChange,
    wordName,
    languages,
    partOfSpeeches,
}: {
    isOpen: boolean;
    onOpen: () => void;
    onOpenChange: () => void;
    wordName: string;
    languages: Language[],
    partOfSpeeches: {
        id: string;
        partOfSpeech: PartOfSpeech;
    }[],
}) {
    const { data, isFetching, isLoading } = api.admin.getWordToEdit.useQuery(wordName, {
        enabled: isOpen,
    })
    const { data: wordAttributes, } = api.admin.getWordAttributes.useQuery()
    const { data: meaningAttributesData } = api.admin.getMeaningAttributes.useQuery()
    const { data: authorsData } = api.admin.getExampleSentenceAuthors.useQuery()
    const { control, setValue, reset } = useForm<EditWordForm>({
        mode: "onSubmit"
    })
    const { fields, append, prepend, remove } = useFieldArray({
        name: "meanings",
        control,
        rules: {
            required: {
                message: "words must have at least one meaning.",
                value: true
            }
        },
    })
    const word_data = data ? data[0].word_data : undefined
    const attributes = word_data?.attributes?.map(att => (att.attribute_id.toString())) ?? []
    const language = word_data?.root.language_code ?? ''
    const name = word_data?.word_name ?? ''
    const root = word_data?.root.root ?? ''
    const phonetic = word_data?.phonetic ?? ''
    const prefix = word_data?.prefix ?? ''
    const suffix = word_data?.suffix ?? ''
    const meaningAttributes = meaningAttributesData?.map((meaningAttribute) => ({
        ...meaningAttribute,
        id: meaningAttribute.id.toString()
    })) ?? []

    const authors = authorsData?.map(author => ({
        ...author,
        id: author.id.toString()
    })) ?? []

    const meanings: EditMeaningForm[] = word_data?.meanings.map((m) => ({
        meaning: m.meaning,
        exampleSentence: m.sentence,
        partOfSpeechId: m.part_of_speech_id.toString(),
        attributes: m.attributes?.map((att) => att.attribute_id.toString()),
        authorId: m.author_id?.toString()
    })) ?? []
    const emptyMeaningValues: Partial<EditMeaningForm> = {
        attributes: [],
        authorId: '',
        exampleSentence: '',
        meaning: '',
        partOfSpeechId: ''
    }
    useEffect(() => {
        const defaultValues = { attributes, language, name, root, phonetic, prefix, suffix, meanings }
        reset(defaultValues)
    }, [name, language, JSON.stringify(attributes), language, root, phonetic])

    const discardChanges = () => {
        const defaultValues = { attributes, language, name, root, phonetic, prefix, suffix, meanings }
        reset(defaultValues)
    }

    if (isFetching || isLoading) {
        return <Spinner />
    }
    if (!data) {
        return <></>
    }

    return (
        <Modal placement='center' size='5xl' backdrop='blur' scrollBehavior='outside' isOpen={isOpen} onOpenChange={onOpenChange} key={`edit-word-modal-${wordName}`}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <h5>Edit Word: <b>{wordName}</b></h5>
                        </ModalHeader>
                        <ModalBody>
                            <WordNameInput control={control} />
                            <div className='grid sm:grid-cols-2 gap-2 '>
                                <WordPhoneticInput control={control} />
                                <WordAttributesInput setFieldValue={setValue} key={wordName} control={control} wordAttributes={wordAttributes ?? []} selectedWordAttributes={data[0].word_data.attributes ?? []} />
                            </div>
                            <div className='grid sm:grid-cols-2 gap-2 '>
                                <WordLanguageInput control={control} languages={languages} selectedLanguage={data[0].word_data.root.language_code} />
                                <WordRootInput control={control} />
                            </div>
                            <div className='grid sm:grid-cols-2 gap-2'>
                                <WordPrefixInput control={control} />
                                <WordSuffixInput control={control} />
                            </div>
                            {fields.map((field, index) => (
                                <Card radius='sm' className="flex-col gap-4" key={field.id}>
                                    <Button radius='sm' variant='light' color='danger' isIconOnly
                                        className='absolute top-2 right-3 z-50'
                                        onPress={() => remove(index)}
                                    >
                                        <X />
                                    </Button>
                                    <CardBody className="flex flex-col gap-2 mt-4">
                                        <MeaningInput index={index} control={control} />
                                        <div className='grid sm:grid-cols-2 gap-2 '>
                                            <PartOfSpeechInput setFieldValue={setValue} index={index} control={control} partOfSpeeches={partOfSpeeches} selectedPartOfSpeechId={meanings[index]?.partOfSpeechId} />
                                            <AttributesInput control={control} index={index} selectedAttributes={meanings[index]?.attributes ?? []} setFieldValue={setValue} attributes={meaningAttributes} />
                                        </div>
                                        <div className='grid sm:grid-cols-2 gap-2 '>
                                            <ExampleSentenceInput control={control} index={index} />
                                            <AuthorInput control={control} index={index} authors={authors} selectedAuthor={meanings[index]?.authorId} setFieldValue={setValue} />
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </ModalBody>
                        <ModalFooter>
                            <ButtonGroup radius='sm' className="w-full gap-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                                <Button
                                    type="button"
                                    radius='sm'
                                    onPress={() => {
                                        prepend(emptyMeaningValues);
                                    }}
                                    endContent={<BetweenVerticalStart />}
                                >
                                    Prepend <span className="max-sm:hidden">Meaning</span>
                                </Button>
                                <Button
                                    radius='sm'
                                    type="button"
                                    onPress={() => {
                                        append(emptyMeaningValues);
                                    }}
                                    endContent={<BetweenVerticalEnd />}
                                >
                                    Append <span className="max-sm:hidden">Meaning</span>
                                </Button>
                                <Button onPress={discardChanges} color='danger'>
                                    Discard Changes
                                </Button>
                                <Button color='primary'>
                                    Submit
                                </Button>
                            </ButtonGroup>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}
