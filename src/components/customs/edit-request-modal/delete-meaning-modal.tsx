"use client"

import { Button } from "@heroui/button"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react"
import { Textarea } from "@heroui/input"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"

const deleteReasonSchema = z.object({
    reason: z.string().min(1, "ReasonRequired").min(15, "ReasonMinLength15")
})

const getDeleteReasonSchemaIntl = (reasonRequired: string, reasonMinLength: string) => z.object({
    reason: z.string().min(1, reasonRequired).min(15, reasonMinLength),
})

type DeleteReasonForm = z.infer<typeof deleteReasonSchema>

interface DeleteMeaningModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: (reason: string) => void
    meaning: string
}

export default function DeleteMeaningModal({ isOpen, onClose, onConfirm, meaning }: DeleteMeaningModalProps) {
    const t = useTranslations()
    const { control, handleSubmit, reset } = useForm<DeleteReasonForm>({
        resolver: zodResolver(getDeleteReasonSchemaIntl(t("Requests.ReasonRequired"), t("Requests.ReasonMinLength15"))),
        defaultValues: {
            reason: ""
        }
    })

    const onSubmit = handleSubmit((data) => {
        onConfirm(data.reason)
        reset()
        onClose()
    })

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <form onSubmit={onSubmit}>
                    <ModalHeader>{t("Requests.DeleteMeaningRequest")}</ModalHeader>
                    <ModalBody>
                        <p className="text-sm text-gray-500">
                            {t("Requests.DeleteMeaningRequestSentence", { meaning })}
                        </p>
                        <div className="mt-4">
                            <Controller
                                name="reason"
                                control={control}
                                render={({ field, fieldState: { error } }) => (
                                    <Textarea
                                        {...field}
                                        placeholder={t("Requests.Reason")}
                                        label={t("Requests.EnterReason")}
                                        isRequired
                                        className="min-h-[100px]"
                                        errorMessage={error?.message}
                                        isInvalid={!!error}
                                    />
                                )}
                            />
                        </div>
                    </ModalBody>
                    <ModalFooter>
                        <Button variant="bordered" onPress={onClose} type="button">{t("Cancel")}</Button>
                        <Button color="danger" type="submit">
                            {t("Requests.SubmitRequest")}
                        </Button>
                    </ModalFooter>
                </form>
            </ModalContent>
        </Modal>
    )
}
