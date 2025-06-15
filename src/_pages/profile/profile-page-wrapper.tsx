"use client"
import { api } from '@/src/trpc/react'
import React from 'react'
import { ProfileDataUser, UserProfilePageClient } from './user-profile-page-client'
import { Session } from 'next-auth'
import { notFound } from 'next/navigation'

export default function ProfilePageWrapper({ profileData, userId, session, locale }: { profileData: ProfileDataUser, userId: string, session: Session | null, locale: string }) {
    const [data, { error }] = api.user.getPublicProfileData.useSuspenseQuery({ userId: userId }, {
        retry: 0,
        initialData: profileData,
    })
    if (error?.data?.code === 'NOT_FOUND') {
        return notFound()
    }
    return (
        <UserProfilePageClient profileData={data} session={session} locale={locale} />
    )
}
