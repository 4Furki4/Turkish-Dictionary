import { api } from '@/src/trpc/react';
import { Button, Modal, ModalBody, ModalContent, ModalFooter, ModalHeader } from '@nextui-org/react';
import React from 'react'
import { useForm } from 'react-hook-form';

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
    const wordQuery = api.word.getWord.useQuery(wordName, {
        enabled: isOpen
    })
    const word = wordQuery.data ? wordQuery.data[0].word_data : null
    return (
        <Modal size='2xl' backdrop='blur' isOpen={isOpen} onOpenChange={onOpenChange}>
            <ModalContent>
                {(onClose) => (
                    <>
                        <ModalHeader className="flex flex-col gap-1">
                            <h5>Edit Word: <b>{wordName}</b></h5>
                        </ModalHeader>
                        <ModalBody>
                        </ModalBody>
                        <ModalFooter>

                        </ModalFooter>
                    </>
                )}
            </ModalContent>
        </Modal>
    )
}
