"use client"
import { api } from '@/src/trpc/react';
import { EditWordForm } from '@/types';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, Spinner } from '@nextui-org/react';
import React from 'react'
import { useForm } from 'react-hook-form';
import WordNameInput from './WordNameInput';
import WordAttribtesInput from './WordAttributesInput';

export default function EditWordModal({
    isOpen,
    onOpenChange,
    wordName
}: {
    isOpen: boolean;
    onOpen: () => void;
    onOpenChange: () => void;
    wordName: string;
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
                        </ModalBody>
                        <ModalFooter>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}
