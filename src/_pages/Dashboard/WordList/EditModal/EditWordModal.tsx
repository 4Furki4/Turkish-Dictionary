"use client"
import { api } from '@/src/trpc/react';
import { EditWordForm, Language } from '@/types';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spinner } from '@nextui-org/react';
import React from 'react'
import { useForm } from 'react-hook-form';
import WordNameInput from './WordNameInput';
import WordAttribtesInput from './WordAttributesInput';
import WordLanguageInput from './WordLanguageInput';

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
    const { control } = useForm<EditWordForm>()
    if (isFetching || isLoading) {
        return <Spinner />
    }
    if (!data) {
        return <></>
    }
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
                            <WordAttribtesInput key={wordName} control={control} wordAttributes={wordAttributes ?? []} selectedWordAttributes={data[0].word_data.attributes ?? []} />
                            <WordLanguageInput control={control} languages={languages} selectedLanguage={data[0].word_data.root.language_code} />
                        </ModalBody>
                        <ModalFooter>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}
