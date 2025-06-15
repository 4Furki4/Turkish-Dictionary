"use client"

import { api } from '@/src/trpc/react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useParams } from 'next/navigation';
import { Input, Link as HeroUILink, Alert, Button, Avatar, Card, CardBody, CardHeader } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { Session } from 'next-auth';
import { toast } from 'sonner';
import { Link } from '@/src/i18n/routing';

const profileSchema = z.object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    name: z.string().min(2, "Name must be at least 2 characters"),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function Profile({
    session
}: { session: Session | null }) {
    const t = useTranslations("Profile");
    const params = useParams();
    const isOwnProfile = session?.user?.id === params.id;

    const { data: profile, refetch, error, isPending, isSuccess, } = api.user.getProfile.useQuery(
        { userId: params.id as string },
        {
            retry: false
        }
    );

    const { handleSubmit, control, formState: { isDirty, isSubmitted } } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            username: session?.user.username || "",
            name: session?.user.name || "",
        }
    });

    const updateProfile = api.user.updateProfile.useMutation({
        onSuccess: async () => {
            toast.success(t("profile_updated"))
            refetch()
        },
        onError: (error) => {
            if (error?.data?.code === "CONFLICT") {
                return toast.error(t("username_taken"))
            }
            toast.error(t("profile_update_failed"))
        }
    });

    const onSubmit = async (data: ProfileForm) => {
        await updateProfile.mutateAsync(data);
    };
    if (error?.data?.code === "NOT_FOUND") {
        return (
            <main className="container mx-auto px-4 py-8">
                <Alert color='danger' className="max-w-lg mx-auto bg-content1 p-6 rounded-lg shadow-lg">
                    <h1>{t("user_not_found")}</h1>
                    <p>{t("user_not_found_description")}</p>
                    <HeroUILink as={Link} href={"/"}>
                        {t("back_to_home")}
                    </HeroUILink>
                </Alert>
            </main>
        );
    }
    if (isPending) {
        return (
            <main className="container mx-auto px-4 py-8">
                <div className="max-w-lg mx-auto bg-content1 p-6 rounded-lg shadow-lg">
                    <p>{t("loading")}</p>
                </div>
            </main>
        );
    }
    if (isSuccess) {
        return (
            <main className="container mx-auto px-4 py-8">
                <Card className="max-w-7xl mx-auto bg-content1 p-6 rounded-lg shadow-lg">
                    <div className="flex items-center gap-4 mb-8">
                        <Avatar
                            showFallback
                            src={profile.image ?? "https://images.unsplash.com/broken"}
                            size="lg"
                        />
                        <div className='flex flex-col'>
                            <h1 className="text-2xl font-bold">{profile.name || t("anonymous")}</h1>
                            <p className="text-gray-500">@{profile.username}</p>
                        </div>
                    </div>

                    {isOwnProfile ? (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div>
                                <Controller control={control} name='username' render={({ field, fieldState: { error } }) => (
                                    <Input
                                        {...field}
                                        label={t("username")}
                                        variant="bordered"
                                        color={error?.message ? "danger" : "default"}
                                        errorMessage={error?.message}
                                    />
                                )} />

                            </div>
                            <div>
                                <Controller control={control} name='name' render={({ field, fieldState: { error } }) => (
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
                                color='primary'
                                className="w-full disabled:opacity-50"
                                disabled={(!isDirty || updateProfile.isPending) && !isSubmitted}
                            >
                                {updateProfile.isPending ? t("updating") : t("update_profile")}
                            </Button>
                        </form>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500">{t("email")}</p>
                                <p>{profile.email}</p>
                            </div>
                        </div>
                    )}
                </Card>
            </main>
        );
    }
}
