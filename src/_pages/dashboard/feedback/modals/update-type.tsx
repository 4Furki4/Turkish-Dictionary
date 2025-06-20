// src/_pages/dashboard/feedback/update-type-modal.tsx
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
import { feedbackTypeEnum } from "@/db/schema/feedbacks";
import { CustomSelect, OptionsMap } from "@/src/components/customs/heroui/custom-select";

type Feedback = {
    id: number;
    type: typeof feedbackTypeEnum.enumValues[number];
};

type UpdateTypeModalProps = {
    isOpen: boolean;
    onClose: () => void;
    feedback: Feedback;
};

export function UpdateTypeModal({
    isOpen,
    onClose,
    feedback,
}: UpdateTypeModalProps) {
    const t = useTranslations("Dashboard.feedback");
    const [type, setType] = useState(new Set([feedback.type]));
    const utils = api.useUtils();

    const updateTypeMutation = api.admin.feedback.updateType.useMutation({
        onSuccess: () => {
            toast.success(t("toasts.type_updated_success"));
            utils.admin.feedback.getAll.invalidate();
            onClose();
        },
        onError: (error) => {
            toast.error(t("toasts.type_updated_error", { error: error.message }));
        },
    });

    const handleSubmit = () => {
        const selectedType = Array.from(type)[0];
        if (selectedType) {
            updateTypeMutation.mutate({ id: feedback.id, type: selectedType as any });
        }
    };

    const selectItems = feedbackTypeEnum.enumValues.map(s => ({ key: s, value: s, label: t(`types.${s}`) }));

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalContent>
                <ModalHeader>{t("update_type_modal.title")}</ModalHeader>
                <ModalBody>
                    <CustomSelect
                        classNames={{
                            base: "w-full"
                        }}
                        label={t("update_type_modal.type_label")}
                        selectedKeys={type}
                        onSelectionChange={setType as any}
                        options={selectItems.reduce((acc, option) => {
                            acc[option.key] = option.label;
                            return acc;
                        }, {} as OptionsMap)}
                    />
                </ModalBody>
                <ModalFooter>
                    <Button color="danger" variant="light" onPress={onClose}>
                        {t("update_type_modal.cancel")}
                    </Button>
                    <Button color="primary" onPress={handleSubmit} isLoading={updateTypeMutation.isPending}>
                        {t("update_type_modal.update")}
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}