"use client"

import { Button } from "@heroui/button"
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter } from "@heroui/react"
import { Textarea } from "@heroui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useTranslations } from "next-intl"

const deleteReasonSchema = z.object({
    reason: z.string().min(1, "Reason is required").min(50, "Reason must be at least 50 characters")
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
    const { register, handleSubmit, formState: { errors }, reset } = useForm<DeleteReasonForm>({
        resolver: zodResolver(deleteReasonSchema),
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
                            <Textarea
                                {...register("reason")}
                                placeholder={t("Requests.EnterReason")}
                                className="min-h-[100px]"
                                errorMessage={errors.reason?.message}
                                isInvalid={!!errors.reason}
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
