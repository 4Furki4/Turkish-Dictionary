"use client"

import { api } from '@/src/trpc/react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { Session } from 'next-auth';
import { toast } from 'sonner';

const completeProfileSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    name: z.string().min(2, "Name must be at least 2 characters"),
});

type CompleteProfileForm = z.infer<typeof completeProfileSchema>;

export default function CompleteProfile({ session }: { session: Session | null }) {
    const t = useTranslations("Profile");
    const router = useRouter();
    const { register, handleSubmit, control } = useForm<CompleteProfileForm>({
        resolver: zodResolver(completeProfileSchema),
        defaultValues: {
            username: session?.user?.username || "",
            name: session?.user?.name || "",
        }
    });

    const updateProfile = api.user.updateProfile.useMutation({
        onSuccess: () => {
            router.push(`/profile/${session?.user?.id}`);
        },
        onError: (error) => {
            if (error?.data?.code === "CONFLICT") {
                return toast.error(t("username_taken"))
            }
        }
    });

    const onSubmit = (data: CompleteProfileForm) => {
        updateProfile.mutate(data);
    };

    return (
        <main className="container mx-auto px-4 py-8">
            <div className="max-w-lg mx-auto bg-content1 p-6 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold mb-6">{t("welcome_message")}</h1>
                <p className="mb-6">{t("profile_completion_message")}</p>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                        <Controller name='username' control={control} render={({ field, fieldState: { error } }) => (
                            <Input
                                {...field}
                                label={t("username")}
                                variant="bordered"
                                color={error?.message ? "danger" : "default"}
                                errorMessage={error?.message}
                                isRequired
                            />
                        )}
                        />
                    </div>

                    <div>
                        <Controller name='name' control={control} render={({ field, fieldState: { error } }) => (
                            <Input
                                {...field}
                                label={t("name")}
                                variant="bordered"
                                color={error?.message ? "danger" : "default"}
                                errorMessage={error?.message}
                                isRequired
                            />
                        )} />
                    </div>

                    <Button
                        type="submit"
                        className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary-500 transition-colors"
                        disabled={updateProfile.isPending}
                    >
                        {updateProfile.isPending ? t("updating") : t("complete_profile")}
                    </Button>
                </form>
            </div>
        </main>
    );
}
