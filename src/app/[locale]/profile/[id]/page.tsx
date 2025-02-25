import Profile from '@/src/_pages/profile/profile'
import { redirect } from '@/src/i18n/routing';
import { auth } from '@/src/server/auth/auth';
import { api } from '@/src/trpc/server';
import { RedirectType } from 'next/navigation';
import React from 'react'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const session = await auth();

    api.user.getProfile.prefetch({
        userId: id
    })
    return (
        <Profile session={session} />
    )
}
