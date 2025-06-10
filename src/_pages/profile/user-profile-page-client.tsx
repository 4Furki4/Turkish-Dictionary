"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { type Session } from 'next-auth';
import { type RouterOutputs } from '@/src/trpc/shared';
import { UserProfileHeader } from './UserProfileHeader';
import { Card, CardHeader, CardBody } from '@heroui/react'; 

export type ProfileDataUser = RouterOutputs['user']['getPublicProfileData'];

// Define ContributionData based on expected structure from profileData.contributions
export type ContributionData = {
    id: string;
    entityType: string;
    word?: { word: string } | null; // Assuming word can be null or have a word property
    requestType: string;
    createdAt: string | Date;
    status: string;
};

// Define SavedWordData based on expected structure from profileData.savedWords
export type SavedWordData = {
    wordId: number; // Assuming wordId is a number based on typical DB IDs
    wordName: string; // Assuming wordName is always present
    savedAt: string | Date;
    firstMeaning: string | null; // Assuming firstMeaning can be null
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

    // Safely access contributions and savedWords, defaulting to empty arrays
    const contributionsToRender: ContributionData[] = (profileData as any).contributions || [];
    const savedWordsToRender: SavedWordData[] = (profileData as any).savedWords || [];
    
    // Safely access contributionStats, defaulting counts to 0
    const rawStats = profileData.contributionStats;
    const totalApprovedCount = rawStats?.totalApproved ?? 0;
    // Ensure totalPending and totalRejected are also accessed safely, as they might not be on the type
    const totalPendingCount = (rawStats as any)?.totalPending ?? 0;
    const totalRejectedCount = (rawStats as any)?.totalRejected ?? 0;

    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <UserProfileHeader profileData={profileData} locale={locale} isOwnProfile={isOwnProfile} user={session?.user ?? null} />

            {/* Account Details Section (only for own profile, shows email) */}
            {isOwnProfile && profileData.email && (
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">{t('accountDetailsTitle')}</h3>
                    </CardHeader>
                    <CardBody>
                        <p><span className="font-medium">{t('emailLabel')}:</span> {profileData.email}</p>
                    </CardBody>
                </Card>
            )}

            {/* Contribution Stats Section */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold">{t('contributionStatsTitle')}</h3>
                </CardHeader>
                <CardBody>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 bg-background rounded-md shadow-sm text-center border">
                            <p className="text-2xl font-bold">{totalApprovedCount}</p>
                            <p className="text-sm text-muted-foreground">{t('approvedContributionsLabel')}</p>
                        </div>
                        <div className="p-4 bg-background rounded-md shadow-sm text-center border">
                            <p className="text-2xl font-bold">{totalPendingCount}</p>
                            <p className="text-sm text-muted-foreground">{t('pendingContributionsLabel')}</p>
                        </div>
                        <div className="p-4 bg-background rounded-md shadow-sm text-center border">
                            <p className="text-2xl font-bold">{totalRejectedCount}</p>
                            <p className="text-sm text-muted-foreground">{t('rejectedContributionsLabel')}</p>
                        </div>
                    </div>
                </CardBody>
            </Card>

            {/* Saved Words Section */}
            {isOwnProfile && (
                <Card>
                    <CardHeader>
                        <h3 className="text-lg font-semibold">{t('savedWordsTitle')}</h3>
                    </CardHeader>
                    <CardBody>
                        {savedWordsToRender.length > 0 ? (
                            <ul className="space-y-3">
                                {savedWordsToRender.map((savedWord) => (
                                    <li key={savedWord.wordId} className="p-3 bg-background rounded-md shadow-sm border">
                                        <p className="font-medium">{savedWord.wordName || t('unknownWord')}</p>
                                        {savedWord.firstMeaning && <p className="text-sm text-muted-foreground truncate">{savedWord.firstMeaning}</p>}
                                        <p className="text-xs text-muted-foreground">
                                            {t('savedOnLabel')}: {new Date(savedWord.savedAt).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })}
                                        </p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-muted-foreground">{t('noSavedWords')}</p>
                        )}
                    </CardBody>
                </Card>
            )}

            {/* Recent Contributions Section */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold">{t('recentContributionsTitle')}</h3>
                </CardHeader>
                <CardBody>
                    {contributionsToRender.length > 0 ? (
                        <ul className="space-y-3">
                            {contributionsToRender.map((contribution) => {
                                let displayText = `${contribution.requestType} - ${contribution.entityType}`;
                                if (contribution.word?.word) {
                                    displayText = `${contribution.word.word} (${contribution.entityType} - ${contribution.requestType})`;
                                }
                                return (
                                    <li key={contribution.id} className="p-3 bg-background rounded-md shadow-sm border">
                                        <p className="font-medium">{displayText}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(contribution.createdAt).toLocaleDateString(locale, { year: 'numeric', month: 'short', day: 'numeric' })} - {contribution.status}
                                        </p>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <p className="text-muted-foreground">{t('noContributions')}</p>
                    )}
                    {/* TODO: Add link to full contributions page/tab */}
                </CardBody>
            </Card>
        </div>
    );
}