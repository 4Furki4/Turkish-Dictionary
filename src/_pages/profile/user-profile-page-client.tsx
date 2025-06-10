"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { type Session } from 'next-auth';
import { type RouterOutputs } from '@/src/trpc/shared';
import { UserProfileHeader } from './UserProfileHeader';

export type ProfileDataUser = RouterOutputs['user']['getPublicProfileData'];
export type ContributionData = {
    id: string;
    entityType: string;
    word?: { word: string } | null;
    requestType: string;
    createdAt: string | Date;
    status: string;
};

export type SavedWordData = {
    wordId: number;
    wordName: string;
    savedAt: string | Date;
    firstMeaning: string | null;
};

interface UserProfilePageClientProps {
    profileData: ProfileDataUser | null;
    session: Session | null;
    locale: string;
}

export function UserProfilePageClient({ profileData, session, locale }: UserProfilePageClientProps) {
    const t = useTranslations('ProfilePage');

    if (!profileData) {
        return (
            <div className="container mx-auto px-4 py-8">
                <p>{t('loadingProfileError')}</p>
            </div>
        );
    }

    const isOwnProfile = session?.user?.id === profileData.id;

    const contributionsToRender = ((profileData as any).contributions as ContributionData[] | undefined) || [];
    const savedWordsToRender = ((profileData as any).savedWords as SavedWordData[] | undefined) || [];

    const stats = profileData.contributionStats as {
        totalPending?: number;
        totalApproved?: number;
        totalRejected?: number;
    } | undefined;

    const totalPendingCount = stats?.totalPending ?? 0;
    const totalApprovedCount = stats?.totalApproved ?? 0;
    const totalRejectedCount = stats?.totalRejected ?? 0;

    // TODO: Implement Tab Navigation (Overview, Contributions, Saved Words, Settings)
    // TODO: Avatar display is in UserProfileHeader, UploadThing integration needed for upload functionality.
    // TODO: Edit Profile button placeholder is in UserProfileHeader, form implementation needed.
    // TODO: Implement Dark Mode Toggle
    // TODO: Add loading skeletons for better UX during data fetch

    return (
        <div className="container mx-auto px-4 py-8">
            <UserProfileHeader profileData={profileData} locale={locale} isOwnProfile={isOwnProfile} user={session?.user ?? null} />

            {/* Account Details Section (only for own profile, shows email) */}
            {isOwnProfile && profileData.email && (
                <div className="bg-card p-6 rounded-lg shadow-md mb-6">
                    <h3 className="text-xl font-semibold mb-3 text-accent">{t('accountDetailsTitle')}</h3>
                    <p><span className="font-medium">{t('emailLabel')}:</span> {profileData.email}</p>
                </div>
            )}

            {/* Contribution Stats */}
            <div className="bg-card p-6 rounded-lg shadow-md mb-6">
                <h3 className="text-xl font-semibold mb-3 text-accent">{t('contributionStatsTitle')}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold">{totalApprovedCount}</p>
                        <p className="text-sm text-muted-foreground">{t('approvedContributionsLabel')}</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{totalPendingCount}</p>
                        <p className="text-sm text-muted-foreground">{t('pendingContributionsLabel')}</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold">{totalRejectedCount}</p>
                        <p className="text-sm text-muted-foreground">{t('rejectedContributionsLabel')}</p>
                    </div>
                </div>
            </div>

            {/* Recent Contributions */}
            {(contributionsToRender.length > 0) ? (
                <div className="bg-card p-6 rounded-lg shadow-md mb-6">
                    <h3 className="text-xl font-semibold mb-3 text-accent">{t('recentContributionsTitle')}</h3>
                    <ul className="space-y-2">
                        {contributionsToRender.map((contribution: ContributionData) => {
                            let entityTextValue = contribution.entityType;
                            if (contribution.entityType === 'word') {
                                if (contribution.word && typeof contribution.word.word === 'string') {
                                    entityTextValue = contribution.word.word;
                                } else {
                                    // Fallback to entityType (e.g., 'word') if word.word is not a string or word is missing
                                    entityTextValue = contribution.entityType;
                                }
                            }
                            const displayText = `${entityTextValue} (${contribution.requestType})`;
                            return (
                                <li key={contribution.id} className="p-3 bg-background rounded-md shadow-sm">
                                    <p className="font-medium">
                                        {displayText}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(contribution.createdAt).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })} - {contribution.status}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                    {/* TODO: Add link to full contributions page/tab */}
                </div>
            ) : null}

            {/* Saved Words (only for own profile) */}
            {isOwnProfile && (savedWordsToRender.length > 0) ? (
                <div className="bg-card p-6 rounded-lg shadow-md">
                    <h3 className="text-xl font-semibold mb-3 text-accent">{t('savedWordsTitle')}</h3>
                    <ul className="space-y-2">
                        {savedWordsToRender.map((savedWord: SavedWordData) => {
                            const wordToDisplay = savedWord.wordName || t('unknownWord');
                            return (
                                <li key={savedWord.wordId} className="p-3 bg-background rounded-md shadow-sm">
                                    <p className="font-medium">{wordToDisplay}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {t('savedOnLabel')}: {new Date(savedWord.savedAt).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </p>
                                </li>
                            );
                        })}
                    </ul>
                    {/* TODO: Add link to full saved words page/tab */}
                </div>
            ) : null}
        </div>
    );
}