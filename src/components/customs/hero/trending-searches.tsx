"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/src/trpc/react';
import { Chip } from '@heroui/react';
import { Link } from '@/src/i18n/routing';

interface TrendingWord {
    id: number;
    name: string;
}

export default function TrendingSearches() {
    const t = useTranslations('Components.TrendingSearches');

    const [trendingWords] = api.word.getPopularWords.useSuspenseQuery(
        { limit: 6, period: 'last7Days' }, // Or 'last30Days'
    );

    return (
        <div className="mt-6">
            <h3 className="text-lg font-semibold mb-3">
                {t("title")}
            </h3>
            <div className="flex flex-wrap gap-2">
                {trendingWords.map((word: TrendingWord) => (
                    <Link href={{
                        pathname: "/search/[word]",
                        params: {
                            word: encodeURIComponent(word.name)
                        }

                    }} key={word.id}>
                        <Chip className="rounded-sm
                    bg-background/80 dark:bg-background/60
                    backdrop-blur-xs
                    px-4 py-2
                    text-sm font-medium
                    text-foreground
                    shadow-sm
                    ring-1 ring-border/50
                    hover:bg-background dark:hover:bg-background/80
                    transition-colors
                    hover:underline"
                        >
                            {word.name}
                        </Chip>
                    </Link>
                ))}
            </div>
        </div>
    );
}
