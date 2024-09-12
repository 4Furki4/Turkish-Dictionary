'use client'
import React from 'react'
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from "@nextui-org/react";
import { api } from '@/src/trpc/react';
import { toast } from 'sonner';

export default function UserDeleteModal({
    isOpen,
    onOpen,
    onOpenChange,
    userId,
    name,
    take,
    skip
}: {
    isOpen: boolean;
    onOpen: () => void;
    onOpenChange: () => void;
    userId: string
    name: string;
    take: number;
    skip: number;
}) {
    const utils = api.useUtils()
    const deleteMutation = api.user.deleteUser.useMutation({
        onSuccess: async (data) => {
            await utils.user.getUsers.invalidate({
                take,
                skip
            })
            toast.success(data.message)
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
                                <h5>Delete User: <b>{name}</b></h5>
                            </ModalHeader>
                            <ModalBody>
                                <p>
                                    Are you sure you want to delete this user?
                                </p>
                            </ModalBody>
                            <ModalFooter>
                                <Button color="primary" variant="light" onPress={onClose}>
                                    Cancel
                                </Button>
                                <Button color="danger" onPress={() => {
                                    deleteMutation.mutate({ userId });
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

