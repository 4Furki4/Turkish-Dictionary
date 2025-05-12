"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/src/trpc/react';
import { Chip, Skeleton } from '@heroui/react';
import { Link } from '@/src/i18n/routing';

interface TrendingWord {
    id: number;
    name: string;
}

export default function TrendingSearches() {
    const t = useTranslations('Components.TrendingSearches');

    const { data: trendingWords, isLoading, isError, error } = api.word.getPopularWords.useQuery(
        { limit: 6, period: 'last7Days' }, // Or 'last30Days'
    );

    if (isLoading) {
        return (
            <div className="mt-6">
                <Skeleton className="h-5 w-32 mb-3" />
                <div className="flex flex-wrap gap-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-20 rounded-md" />
                    ))}
                </div>
            </div>
        );
    }

    if (isError) {
        console.error("Error fetching trending searches:", error);
        return null;
    }

    if (!trendingWords || trendingWords.length === 0) {
        return null;
    }

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">
                {t("title")}
            </h3>
            <div className="flex flex-wrap gap-2">
                {trendingWords.map((word: TrendingWord) => (
                    <Link key={word.id} href={{
                        pathname: "/search/[word]",
                        params: {
                            word: encodeURIComponent(word.name)
                        }
                    }}>
                        <Chip className="rounded-sm 
                        bg-background/80 dark:bg-background/60
                        backdrop-blur-xs
                        px-4 py-2 
                        text-sm font-medium 
                        text-foreground
                        shadow-sm 
                        ring-1 ring-border/50
                        hover:bg-background dark:hover:bg-background/80
                        transition-colors"
                        >
                            {word.name}
                        </Chip>
                    </Link>
                ))}
            </div>
        </div>
    );
}
