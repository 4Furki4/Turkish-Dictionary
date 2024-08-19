"use client"
import { api } from '@/src/trpc/react';
import React from 'react'
import { Button, Input, Modal, ModalBody, ModalContent, ModalHeader, ModalVariantProps } from '@nextui-org/react'
import { NewAttributeForm } from '@/types';
import { toast } from 'sonner';
import { Controller, useForm } from 'react-hook-form';
import { AriaModalOverlayProps } from '@react-aria/overlays';
type AddAuthorModalProps = {
    onClose: () => void,
    isOpen: boolean,
    onOpenChange: () => void,
} & AriaModalOverlayProps & ModalVariantProps
export default function AddAuthorModal({
    isOpen,
    onClose,
    onOpenChange,
    ...modalProps
}: AddAuthorModalProps) {
    const { control: newAttributeControl, handleSubmit, reset } = useForm<NewAttributeForm>()
    const adminUtils = api.useUtils().admin
    const addAuthorMutation = api.admin.addAuthor.useMutation({
        onError(error, variables, context) {
            console.log(error)
            toast.error("An error occured, please try again.")
        },
        onSuccess(data) {
            reset()
            toast.success("Attribute has been added successfully!")
            onClose()
            adminUtils.getExampleSentenceAuthors.invalidate()
        }
    })
    function onNewAttributeSubmit(newAttribute: NewAttributeForm) {
        addAuthorMutation.mutate(newAttribute.attribute)
    }
    return (
        <Modal size='xs' isOpen={isOpen} onOpenChange={onOpenChange} key="create-attribute-modal" {...modalProps}>
            <ModalContent>
                {(close) => (
                    <>
                        <ModalHeader>
                            Add new author
                        </ModalHeader>
                        <ModalBody>
                            <form key={'add-author-form'} onSubmit={handleSubmit(onNewAttributeSubmit)} className='grid gap-2'>
                                <Controller control={newAttributeControl} name='attribute' rules={{
                                    required: {
                                        value: true,
                                        message: "Author name is required."
                                    },
                                    minLength: {
                                        message: "Author name length must be greater than 2.",
                                        value: 2
                                    }
                                }} render={({ field, fieldState: { error } }) => (
                                    <Input placeholder='Type new author' {...field} isInvalid={error !== undefined} errorMessage={error?.message} />
                                )} />
                                <div className='grid grid-cols-2 gap-2'>
                                    <Button size='sm' type='submit' color='primary' isLoading={addAuthorMutation.isPending}>
                                        Submit
                                    </Button>
                                    <Button size='sm' onPress={close}>
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        </ModalBody>
                    </>
                )}
            </ModalContent>
        </Modal>

    )
}
