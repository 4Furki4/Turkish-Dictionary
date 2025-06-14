"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { api } from "@/src/trpc/react";
import { toast } from "sonner";
import {
    Button,
    Modal,
    ModalBody,
    ModalContent,
    ModalHeader,
    Input,
    RadioGroup,
    Radio,
    Textarea,
    Link,
} from "@heroui/react";
import { feedbackTypeEnum } from "@/db/schema/feedbacks";

// Zod schema for form validation
const feedbackSchema = z.object({
    title: z.string().min(5, "Error.titleMinLength"),
    description: z.string().min(10, "Error.descriptionMinLength"),
    type: z.enum(feedbackTypeEnum.enumValues),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export function FeedbackModal({
    children,
    disabled = false,
    variant = "button",
}: {
    children: React.ReactNode;
    disabled?: boolean;
    variant?: "button" | "link";
}) {
    const [isOpen, setIsOpen] = useState(false);
    const t = useTranslations("Feedback.NewForm");
    const tError = useTranslations();
    const utils = api.useUtils();

    const {
        register,
        handleSubmit,
        control,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<FeedbackFormValues>({
        resolver: zodResolver(feedbackSchema),
        defaultValues: { type: "feature" },
    });

    const createFeedback = api.feedback.create.useMutation({
        onSuccess: () => {
            toast.success(t("submitSuccess"));
            utils.feedback.list.invalidate(); // Refresh the feedback list
            setIsOpen(false); // Close modal on success
            reset(); // Clear the form
        },
        onError: (error) => {
            toast.error(tError(error.message as any));
        },
    });

    const onSubmit = (data: FeedbackFormValues) => {
        createFeedback.mutate(data);
    };
    const Trigger =
        variant === "link" ? (
            <Link
                href="#"
                onPress={() => setIsOpen(true)}
                underline="hover"
                isDisabled={disabled}
                className="text-base text-text-foreground/60 hover:text-primary cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {children}
            </Link>
        ) : (
            <Button color="primary" isDisabled={disabled} onPress={() => setIsOpen(true)}>
                {children}
            </Button>
        );
    return (
        <>
            {Trigger}
            <Modal isOpen={isOpen} onOpenChange={setIsOpen}>
                <ModalContent>
                    {(close) => (
                        <>
                            <ModalHeader>{t("title")}</ModalHeader>
                            <ModalBody>
                                <p className="text-muted-foreground pb-4">{t("description")}</p>
                                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    <div>
                                        <label className="font-semibold">{t("typeLabel")}</label>
                                        <Controller
                                            name="type"
                                            control={control}
                                            render={({ field }) => (
                                                <RadioGroup {...field} className="mt-2 flex gap-4">
                                                    <Radio value="feature">{t("types.feature")}</Radio>
                                                    <Radio value="bug">{t("types.bug")}</Radio>
                                                </RadioGroup>
                                            )}
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="title" className="font-semibold">
                                            {t("feedbackTitleLabel")}
                                        </label>
                                        <Input
                                            id="title"
                                            {...register("title")}
                                            placeholder={t("feedbackTitlePlaceholder")}
                                            className="mt-2"
                                        />
                                        {errors.title && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {tError(errors.title.message as any)}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <label htmlFor="description" className="font-semibold">
                                            {t("feedbackDescriptionLabel")}
                                        </label>
                                        <Textarea
                                            id="description"
                                            {...register("description")}
                                            placeholder={t("feedbackDescriptionPlaceholder")}
                                            rows={5}
                                            className="mt-2"
                                        />
                                        {errors.description && (
                                            <p className="text-red-500 text-sm mt-1">
                                                {tError(errors.description.message as any)}
                                            </p>
                                        )}
                                    </div>
                                    <div className="flex justify-end gap-2 pt-4">
                                        <Button type="button" variant="ghost" onPress={close}>
                                            {t("cancel")}
                                        </Button>
                                        <Button type="submit" color="primary" isLoading={isSubmitting}>
                                            {t("submitButton")}
                                        </Button>
                                    </div>
                                </form>
                            </ModalBody>
                        </>
                    )}
                </ModalContent>
            </Modal>
        </>
    );
}
