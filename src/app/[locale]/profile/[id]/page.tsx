import { auth } from '@/src/server/auth/auth';
import { api } from '@/src/trpc/server';
import React from 'react';
import { UserProfilePageClient } from '@/src/_pages/profile/user-profile-page-client';
import { TRPCError } from '@trpc/server';
import { redirect } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

interface ProfilePageProps {
    params: Promise<{
        id: string;
        locale: string;
    }>;
}

export default async function ProfilePage({ params: paramsPromise }: ProfilePageProps) {
    const { id, locale } = await paramsPromise;
    setRequestLocale(locale);

    const session = await auth();

    try {
        const profileData = await api.user.getPublicProfileData({ userId: id });
        if (!profileData) {
            // This case should ideally be handled by tRPC throwing an error if user not found
            // but as a fallback:
            redirect(`/${locale}/not-found`); // Or a more specific error page
        }

        return <UserProfilePageClient profileData={profileData} session={session} locale={locale} />;
    } catch (error) {
        if (error instanceof TRPCError && error.code === 'NOT_FOUND') {
            redirect(`/${locale}/not-found`);
        }
        // Handle other errors appropriately, maybe show a generic error page
        console.error('Failed to load profile data:', error);
        // For now, redirect to a generic error or home page
        redirect(`/${locale}/error`); // Assuming you have an error page
    }
}
