import { api } from '@/src/trpc/react';
import { EditWordForm } from '@/types';
import { Button, Input, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@nextui-org/react';
import React from 'react'
import { Controller, useForm } from 'react-hook-form';
import WordNameInput from './WordNameInput';
import WordAttribtesInput from './WordAttribtesInput';

export default function EditWordModal({
    isOpen,
    onOpen,
    onOpenChange,
    wordName
}: {
    isOpen: boolean;
    onOpen: () => void;
    onOpenChange: () => void;
    wordName: string;
}) {
    const wordQuery = api.admin.getWordToEdit.useQuery(wordName, {
        enabled: isOpen
    })
    const { control } = useForm<EditWordForm>()
    return (
        <Modal size='2xl' backdrop='blur' isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <h5>Edit Word: <b>{wordName}</b></h5>
                        </ModalHeader>
                        <ModalBody>
                            <WordNameInput control={control} />
                        </ModalBody>
                        <ModalFooter>
                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}
