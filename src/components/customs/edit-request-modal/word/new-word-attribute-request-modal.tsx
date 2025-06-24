import { api } from "@/src/trpc/react";
import { NewAttributeForm } from "@/types";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalVariantProps, Input, Button } from "@heroui/react";
import { AriaModalOverlayProps } from '@react-aria/overlays';
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";
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
    const { executeRecaptcha } = useGoogleReCaptcha();
    const { control: newAttributeControl, handleSubmit, reset } = useForm<NewAttributeForm>()
    const t = useTranslations();
    const requestUtils = api.useUtils().request
    const addWordAttributeMutation = api.request.newWordAttribute.useMutation({
        onError(error, variables, context) {
            console.log(error)
            if (error.message === "captchaFailed") {
                toast.error(t("Errors.captchaFailed"))
            } else {
                toast.error(t("Requests.ErrorSubmittingRequest"))
            }
        },
        onSuccess(data) {
            reset()
            toast.success(t("Requests.AttributeRequestedSuccessfully"))
            requestUtils.getWordAttributesWithRequested.invalidate()
            onClose()
        }
    })
    async function onNewAttributeSubmit(newAttribute: NewAttributeForm) {
        if (!executeRecaptcha) {
            toast.error(t("Errors.captchaError"));
            return;
        }
        try {
            const token = await executeRecaptcha("new_word_attribute_request");
            addWordAttributeMutation.mutate({ attribute: newAttribute.attribute, captchaToken: token });
        } catch (error) {
            console.error("reCAPTCHA execution failed:", error);
            toast.error(t("Errors.captchaError"));
        }
    }
    return (
        <Modal size='xs' isOpen={isOpen} onOpenChange={onOpenChange} key="create-attribute-modal" {...modalProps}>
            <ModalContent>
                {(close) => (
                    <>
                        <ModalHeader>
                            {t("AddNewWordAttribute")}
                        </ModalHeader>
                        <ModalBody>
                            <form key={'add-word-attribute-form'} onSubmit={(e) => {
                                e.stopPropagation()
                                handleSubmit(onNewAttributeSubmit)(e)
                            }} className='grid gap-2'>
                                <Controller control={newAttributeControl} name='attribute' rules={{
                                    required: {
                                        value: true,
                                        message: t("Forms.Attributes.Required")
                                    },
                                    minLength: {
                                        message: t("Forms.Attributes.MinLength2"),
                                        value: 2
                                    }
                                }} render={({ field, fieldState: { error } }) => (
                                    <Input placeholder={t("EnterWordAttribute")} {...field} isInvalid={error !== undefined} errorMessage={error?.message} />
                                )} />
                                <div className='grid grid-cols-2 gap-2'>
                                    <Button size='sm' type='submit' color='primary' isLoading={addWordAttributeMutation.isPending}>
                                        {t("Requests.SubmitRequest")}
                                    </Button>
                                    <Button size='sm' onPress={close}>
                                        {t("Cancel")}
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
