import { api } from "@/src/trpc/react";
import { NewAttributeForm } from "@/types";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalVariantProps, Input, Button } from "@heroui/react";
import { AriaModalOverlayProps } from '@react-aria/overlays';
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
type AddWordAttributeModalProps = {
    onClose: () => void,
    isOpen: boolean,
    onOpenChange: () => void
} & AriaModalOverlayProps & ModalVariantProps
export default function NewWordAttributeRequestModal({
    isOpen,
    onOpenChange,
    onClose,
    ...modalProps
}: AddWordAttributeModalProps) {
    const { control: newAttributeControl, handleSubmit, reset } = useForm<NewAttributeForm>()
    const requestUtils = api.useUtils().request
    const addWordAttributeMutation = api.request.newWordAttribute.useMutation({
        onError(error, variables, context) {
            console.log(error)
            toast.error("An error occured, please try again.")
        },
        onSuccess(data) {
            reset()
            toast.success("Attribute has been added successfully!")
            requestUtils.getWordAttributesWithRequested.invalidate()
            onClose()
        }
    })
    function onNewAttributeSubmit(newAttribute: NewAttributeForm) {
        addWordAttributeMutation.mutate(newAttribute.attribute)
    }
    return (
        <Modal size='xs' isOpen={isOpen} onOpenChange={onOpenChange} key="create-attribute-modal" {...modalProps}>
            <ModalContent>
                {(close) => (
                    <>
                        <ModalHeader>
                            Add new word attribute
                        </ModalHeader>
                        <ModalBody>
                            <form key={'add-word-attribute-form'} onSubmit={(e) => {
                                e.stopPropagation()
                                handleSubmit(onNewAttributeSubmit)(e)
                            }} className='grid gap-2'>
                                <Controller control={newAttributeControl} name='attribute' rules={{
                                    required: {
                                        value: true,
                                        message: "Attribute is required."
                                    },
                                    minLength: {
                                        message: "Attribute length must be greater than 2.",
                                        value: 2
                                    }
                                }} render={({ field, fieldState: { error } }) => (
                                    <Input placeholder='Type new attribute' {...field} isInvalid={error !== undefined} errorMessage={error?.message} />
                                )} />
                                <div className='grid grid-cols-2 gap-2'>
                                    <Button size='sm' type='submit' color='primary' isLoading={addWordAttributeMutation.isPending}>
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
