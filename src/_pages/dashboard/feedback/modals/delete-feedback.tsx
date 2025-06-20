"use client";

import {
    Modal,
    ModalContent,
    ModalHeader,
    ModalBody,
    ModalFooter,
    Button,
} from "@heroui/react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

import { api } from "@/src/trpc/react";

type Feedback = {
    id: number;
    title: string;
};

type DeleteFeedbackModalProps = {
    isOpen: boolean;
    onClose: () => void;
    feedback: Feedback;
};

export function DeleteFeedbackModal({
    isOpen,
    onClose,
    feedback,
}: DeleteFeedbackModalProps) {
    const t = useTranslations("Dashboard.feedback");
    const utils = api.useUtils();

    const deleteMutation = api.admin.feedback.delete.useMutation({
        onSuccess: () => {
            toast.success(t("toasts.deleted_success"));
            utils.admin.feedback.getAll.invalidate();
            onClose();
        },
        onError: (error) => {
            toast.error(t("toasts.deleted_error", { error: error.message }));
        },
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader>{t("delete_modal.title")}</ModalHeader>
                <ModalBody>
                    <p>{t("delete_modal.confirmation_message", { title: feedback.title })}</p>
                </ModalBody>
                <ModalFooter>
                    <Button variant="light" onPress={onClose}>
                        {t("delete_modal.cancel")}
                    </Button>
                    <Button
                        color="danger"
                        onPress={() => deleteMutation.mutate({ id: feedback.id })}
                        isLoading={deleteMutation.isPending}
                    >
                        {t("delete_modal.delete")}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
