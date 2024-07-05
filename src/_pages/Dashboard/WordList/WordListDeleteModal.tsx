'use client'
import React from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@nextui-org/react";
import { api } from '@/src/trpc/react';
import { toast } from 'sonner';

export default function WordListDeleteModal({
    isOpen,
    onOpen,
    onOpenChange,
    wordId,
    name,
    take,
    skip
}: {
    isOpen: boolean;
    onOpen: () => void;
    onOpenChange: () => void;
    wordId: number;
    name: string;
    take: number;
    skip: number;
}) {
    const utils = api.useUtils()
    const deleteMutation = api.admin.deleteWord.useMutation({
        onSuccess: async () => {
            const getWordsInvalidation = utils.word.getWords.invalidate({
                take,
                skip
            })
            const getWordCountInvalidation = utils.word.getWordCount.invalidate()
            await Promise.all([getWordsInvalidation, getWordCountInvalidation])
        },
        onError: (err) => {
            toast.error(err.message, {
                position: "top-center",
            });
        },
    });
    return (
        <>
            <Modal size='2xl' backdrop='blur' isOpen={isOpen} onOpenChange={onOpenChange}>
                <ModalContent>
                    {(onClose) => (
                        <>
                            <ModalHeader className="flex flex-col gap-1">
                                <h5>Delete Word: <b>{name}</b></h5>
                            </ModalHeader>
                            <ModalBody>
                                <p>
                                    Are you sure you want to delete this word?
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="primary" variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button color="danger" onPress={() => {
                                    deleteMutation.mutate({ id: wordId });
                                    onClose();
                                }}>
                                    Delete
                                </Button>
                            </ModalFooter>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}

