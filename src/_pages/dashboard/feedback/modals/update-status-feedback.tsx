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
import { useState } from "react";
import { toast } from "sonner";

import { api } from "@/src/trpc/react";
import { feedbackStatusEnum } from "@/db/schema/feedbacks";
import { CustomSelect, OptionsMap } from "@/src/components/customs/heroui/custom-select";

type Feedback = {
    id: number;
    status: typeof feedbackStatusEnum.enumValues[number];
};

type UpdateStatusModalProps = {
    isOpen: boolean;
    onClose: () => void;
    feedback: Feedback;
};

export function UpdateStatusModal({
    isOpen,
    onClose,
    feedback,
}: UpdateStatusModalProps) {
    const t = useTranslations("Dashboard.feedback");
    const [status, setStatus] = useState(new Set([feedback.status]));
    const utils = api.useUtils();

    const updateStatusMutation = api.admin.feedback.updateStatus.useMutation({
        onSuccess: () => {
            toast.success(t("toasts.status_updated_success"));
            utils.admin.feedback.getAll.invalidate();
            onClose();
        },
        onError: (error) => {
            toast.error(t("toasts.status_updated_error", { error: error.message }));
        },
    });

    const handleSubmit = () => {
        const selectedStatus = Array.from(status)[0];
        if (selectedStatus) {
            updateStatusMutation.mutate({ id: feedback.id, status: selectedStatus as any });
        }
    };

    const selectItems = feedbackStatusEnum.enumValues.map(s => ({ key: s, value: s, label: t(`statuses.${s}`) }));

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader>{t("update_status_modal.title")}</ModalHeader>
                <ModalBody>
                    <CustomSelect
                        classNames={{
                            base: "w-full"
                        }}
                        label={t("update_status_modal.status_label")}
                        selectedKeys={status}
                        onSelectionChange={setStatus as any}
                        options={selectItems.reduce((acc, option) => {
                            acc[option.key] = option.label;
                            return acc;
                        }, {} as OptionsMap)}
                    />
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                        {t("update_status_modal.cancel")}
                    </Button>
                    <Button color="primary" onPress={handleSubmit} isLoading={updateStatusMutation.isPending}>
                        {t("update_status_modal.update")}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}