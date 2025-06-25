import { api } from "@/src/trpc/react";
import { NewAuthorForm } from "@/types";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalVariantProps, Input, Button } from "@heroui/react";
import { AriaModalOverlayProps } from '@react-aria/overlays';
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";

type AddAuthorModalProps = {
    onClose: () => void,
    isOpen: boolean,
    onOpenChange: () => void,
    onAuthorRequested?: (author: string) => void
} & AriaModalOverlayProps & ModalVariantProps

export default function NewAuthorRequestModal({
    isOpen,
    onOpenChange,
    onClose,
    onAuthorRequested,
    ...modalProps
}: AddAuthorModalProps) {
    const { executeRecaptcha } = useGoogleReCaptcha();
    const { control: newAuthorControl, handleSubmit, reset } = useForm<NewAuthorForm>()
    const t = useTranslations();
    const requestUtils = api.useUtils().request

    const addAuthorMutation = api.request.newAuthor.useMutation({
        onError(error: unknown, variables: NewAuthorForm, context: unknown) {
            console.log(error)
            if (error instanceof Error && error.message === "captchaFailed") {
                toast.error(t("Errors.captchaFailed"))
            } else {
                toast.error(t("Requests.ErrorSubmittingRequest"))
            }
        },
        onSuccess(data: unknown, variables: NewAuthorForm) {
            reset()
            toast.success(t("Requests.AuthorRequestedSuccessfully"))
            // Temporarily add to selection list
            if (onAuthorRequested) {
                onAuthorRequested(variables.name)
            }
            requestUtils.getAuthorsWithRequested.invalidate()
            onClose()
        }
    })

    async function onNewAuthorSubmit(newAuthor: NewAuthorForm) {
        if (!executeRecaptcha) {
            toast.error(t("Errors.captchaError"));
            return;
        }
        try {
            const token = await executeRecaptcha("new_author_request");
            addAuthorMutation.mutate({ name: newAuthor.name, captchaToken: token });
        } catch (error) {
            console.error("reCAPTCHA execution failed:", error);
            toast.error(t("Errors.captchaError"));
        }
    }

    return (
        <Modal size='xs' isOpen={isOpen} onOpenChange={onOpenChange} key="create-author-modal" {...modalProps}>
            <ModalContent>
                {(close) => (
                    <>
                        <ModalHeader>
                            {t("AddNewAuthor")}
                        </ModalHeader>
                        <ModalBody>
                            <form key={'add-author-form'} onSubmit={(e) => {
                                e.stopPropagation()
                                handleSubmit(onNewAuthorSubmit)(e)
                            }} className='grid gap-2'>
                                <Controller control={newAuthorControl} name='name' rules={{
                                    required: {
                                        value: true,
                                        message: t("Forms.Authors.Required")
                                    },
                                    minLength: {
                                        message: t("Forms.Authors.MinLength2"),
                                        value: 2
                                    }
                                }} render={({ field, fieldState: { error } }) => (
                                    <Input placeholder={t("EnterAuthorName")} {...field} isInvalid={error !== undefined} errorMessage={error?.message} />
                                )} />
                                <div className='grid grid-cols-2 gap-2'>
                                    <Button size='sm' type='submit' color='primary' isLoading={addAuthorMutation.isPending}>
                                        {t("Forms.Submit")}
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
