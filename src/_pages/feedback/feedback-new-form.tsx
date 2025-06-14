"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { api } from "@/src/trpc/react";
import { toast } from "sonner";
import { useRouter } from "@/src/i18n/routing";
import { Button, Card, CardBody, CardHeader, Input, RadioGroup, Radio, Textarea } from "@heroui/react";
import { feedbackTypeEnum } from "@/db/schema/feedbacks";

// Zod schema for form validation
const feedbackSchema = z.object({
    title: z.string().min(5),
    description: z.string().min(10),
    type: z.enum(feedbackTypeEnum.enumValues),
});

type FeedbackFormValues = z.infer<typeof feedbackSchema>;

export function NewFeedbackForm() {
    const t = useTranslations("Feedback.NewForm");
    const tError = useTranslations();
    const router = useRouter();
    // const { data: session, status } = useSession();

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<FeedbackFormValues>({
        resolver: zodResolver(feedbackSchema),
        defaultValues: {
            type: "feature",
        },
    });

    const createFeedback = api.feedback.create.useMutation({
        onSuccess: () => {
            toast.success(t("submitSuccess"));
            router.push("/feedback");
        },
        onError: (error) => {
            toast.error(tError(error.message as any));
        },
    });

    const onSubmit = (data: FeedbackFormValues) => {
        createFeedback.mutate(data);
    };


    return (
        <div className="container mx-auto max-w-2xl py-8 px-4">
            <Card>
                <CardHeader>
                    <h1 className="text-2xl font-bold">{t("title")}</h1>
                    <p className="text-muted-foreground">{t("description")}</p>
                </CardHeader>
                <CardBody>
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
                            <label htmlFor="title" className="font-semibold">{t("feedbackTitleLabel")}</label>
                            <Input
                                id="title"
                                {...register("title")}
                                placeholder={t("feedbackTitlePlaceholder")}
                                className="mt-2"
                            />
                            {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>}
                        </div>

                        <div>
                            <label htmlFor="description" className="font-semibold">{t("feedbackDescriptionLabel")}</label>
                            <Textarea
                                id="description"
                                {...register("description")}
                                placeholder={t("feedbackDescriptionPlaceholder")}
                                rows={5}
                                className="mt-2"
                            />
                            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>}
                        </div>

                        <Button
                            type="submit"
                            color="primary"
                            className="w-full"
                            disabled={createFeedback.isPending}
                        >
                            {createFeedback.isPending ? t("submitting") : t("submitButton")}
                        </Button>
                    </form>
                </CardBody>
            </Card>
        </div>
    );
}
