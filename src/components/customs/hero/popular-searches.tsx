"use client";

import React from 'react';
import { Link } from '@/src/i18n/routing';
import { api } from '@/src/trpc/react';
import { Chip } from '@heroui/react';
import { useTranslations } from 'next-intl';

interface PopularWord {
    id: number;
    name: string;
}

export default function PopularSearches() {
    const t = useTranslations('Components.PopularSearches');
    const [popularWords] = api.word.getPopularWords.useSuspenseQuery(
        { limit: 6, period: 'allTime' }
    );

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

                    <Link
                        key={word.id}

                        href={{
                            pathname: "/search/[word]",
                            params: {
                                word: encodeURIComponent(word.name)
                            }
                        }}
                    >
                        <Chip className="rounded-sm
                    bg-background/80 dark:bg-background/60
                    px-4 py-2
                    text-sm font-medium
                    text-foreground
                    shadow-sm
                    ring-1 ring-border/50
                    hover:bg-background dark:hover:bg-background/80
                    transition-colors
                    hover:underline
                    backdrop-blur-xs"
                        >
                            {word.name}
                        </Chip>
                    </Link>
                ))}
            </div>
        </div>
    );
}