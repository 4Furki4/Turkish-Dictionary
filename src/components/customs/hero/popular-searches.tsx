"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/src/i18n/routing';
import { api } from '@/src/trpc/react';
import { Chip, Skeleton } from '@heroui/react';

interface PopularWord {
    id: number;
    name: string;
}

export default function PopularSearches() {
    const t = useTranslations('Components.PopularSearches');

    const { data: popularWords, isLoading, isError, error } = api.word.getPopularWords.useQuery(
        { limit: 6, period: 'allTime' }
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
        console.error("Error fetching popular searches:", error);
        return null;
    }

    if (!popularWords || popularWords.length === 0) {
        return null;
    }

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">
                {t("title")}
            </h3>
            <div className="flex flex-wrap gap-2">
                {popularWords.map((word: PopularWord) => (
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