"use client"
import { api } from '@/src/trpc/react';
import React from 'react'
import { Button, Input, Modal, ModalBody, ModalContent, ModalHeader, ModalVariantProps } from "@heroui/react"
import { NewAttributeForm } from '@/types';
import { toast } from 'sonner';
import { Controller, useForm } from 'react-hook-form';
import { AriaModalOverlayProps } from '@react-aria/overlays';
import { useTranslations } from 'next-intl';
type AddMeaningAttributeModalProps = {
    onClose: () => void,
    isOpen: boolean,
    onOpenChange: () => void
} & AriaModalOverlayProps & ModalVariantProps
export default function AddMeaningAttributeModal({
    onClose,
    isOpen,
    onOpenChange,
    ...modalProps
}: AddMeaningAttributeModalProps) {
    const t = useTranslations();
    const { control: newAttributeControl, handleSubmit, reset } = useForm<NewAttributeForm>()
    const paramsUtils = api.useUtils().params
    const addMeaningAttributeMutation = api.admin.addNewMeaningAttribute.useMutation({
        onError(error, variables, context) {
            console.log(error)
            toast.error(t("AnErrorOccuredPleaseTryAgain"))
        },
        onSuccess(data) {
            reset()
            toast.success(t("AttributeAddedSuccessfully"))
            onClose()
            paramsUtils.getExampleSentenceAuthors.invalidate()
        }
    })
    function onNewAttributeSubmit(newAttribute: NewAttributeForm) {
        addMeaningAttributeMutation.mutate(newAttribute.attribute)
    }
    return (
        <Modal size='xs' isOpen={isOpen} onOpenChange={onOpenChange} key="create-attribute-modal" {...modalProps}>
            <ModalContent>
                {(close) => (
                    <>
                        <ModalHeader>
                            {t('AddNewMeaningAttribute')}
                        </ModalHeader>
                        <ModalBody>
                            <form key={'add-word-attribute-form'} onSubmit={(e) => {
                                e.stopPropagation()
                                handleSubmit(onNewAttributeSubmit)(e)
                            }} className='grid gap-2'>
                                <Controller control={newAttributeControl} name='attribute' rules={{
                                    required: {
                                        value: true,
                                        message: t('Forms.MeaningAttributes.Required')
                                    },
                                    minLength: {
                                        message: t('Forms.MeaningAttributes.MinLength2'),
                                        value: 2
                                    }
                                }} render={({ field, fieldState: { error } }) => (
                                    <Input placeholder={t('EnterMeaningAttribute')} {...field} isInvalid={error !== undefined} errorMessage={error?.message} />
                                )} />
                                <div className='grid grid-cols-2 gap-2'>
                                    <Button size='sm' type='submit' color='primary' isLoading={addMeaningAttributeMutation.isPending}>
                                        {t('Submit')}
                                    </Button>
                                    <Button size='sm' onPress={close}>
                                        {t('Cancel')}
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
