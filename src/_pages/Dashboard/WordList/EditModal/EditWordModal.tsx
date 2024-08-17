"use client"
import { api } from '@/src/trpc/react';
import { EditWordForm, Language } from '@/types';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spinner } from '@nextui-org/react';
import React, { useEffect } from 'react'
import { useForm } from 'react-hook-form';
import WordNameInput from './WordNameInput';
import WordAttribtesInput from './WordAttributesInput';
import WordLanguageInput from './WordLanguageInput';
import WordRootInput from './WordRootInput';
import WordPhoneticInput from './WordPhoneticInput';
import WordSuffixInput from './WordSuffixInput';
import WordPrefixInput from './WordPrefixInput';

export default function EditWordModal({
    isOpen,
    onOpenChange,
    wordName,
    languages
}: {
    isOpen: boolean;
    onOpen: () => void;
    onOpenChange: () => void;
    wordName: string;
    languages: Language[]
}) {
    const { data, isFetching, isLoading } = api.admin.getWordToEdit.useQuery(wordName, {
        enabled: isOpen,
    })
    const { data: wordAttributes } = api.admin.getWordAttributes.useQuery()
    console.log(data)
    const { control, watch, setValue, reset } = useForm<EditWordForm>()
    const word_data = data ? data[0].word_data : undefined
    const attributes = word_data?.attributes?.map(att => (att.attribute_id.toString())) ?? []
    const language = word_data?.root.language_code ?? ''
    const name = word_data?.word_name ?? ''
    const root = word_data?.root.root ?? ''
    const phonetic = word_data?.phonetic ?? ''
    const prefix = word_data?.prefix ?? ''
    const suffix = word_data?.suffix ?? ''
    useEffect(() => {
        const defaultValues = { attributes, language, name, root, phonetic, prefix, suffix }
        reset(defaultValues)
    }, [name, language, JSON.stringify(attributes), language, root, phonetic])
    if (isFetching || isLoading) {
        return <Spinner />
    }
    if (!data) {
        return <></>
    }
    console.log(watch())
    return (
        <Modal placement='center' size='2xl' backdrop='blur' isOpen={isOpen} onOpenChange={onOpenChange} key={`edit-word-modal-${wordName}`}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <h5>Edit Word: <b>{wordName}</b></h5>
                        </ModalHeader>
                        <ModalBody>
                            <WordNameInput control={control} />
                            <WordAttribtesInput setFieldValue={setValue} key={wordName} control={control} wordAttributes={wordAttributes ?? []} selectedWordAttributes={data[0].word_data.attributes ?? []} />
                            <div className='grid grid-cols-2 gap-2 justify-center'>
                                <WordLanguageInput control={control} languages={languages} selectedLanguage={data[0].word_data.root.language_code} />
                                <WordRootInput control={control} />
                            </div>
                            <WordPhoneticInput control={control} />
                            <div className='grid grid-cols-2 gap-2'>
                                <WordSuffixInput control={control} />
                                <WordPrefixInput control={control} />
                            </div>
                        </ModalBody>
                        <ModalFooter>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}
