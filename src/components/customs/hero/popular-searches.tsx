"use client";

import React from 'react';
import { Link } from '@/src/i18n/routing';
import { api } from '@/src/trpc/react';
import { Chip } from '@heroui/react';
import { useTranslations } from 'next-intl';
import { Flame } from 'lucide-react';

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
            <div className="flex items-center gap-2 mb-3">
                <Flame className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">
                    {t("title")}
                </h3>
            </div>
            <div className="flex flex-wrap gap-2">
                {popularWords.map((word: PopularWord) => (
                    <Link
                        key={word.id}
                        href={{
                            pathname: "/search/[word]",
                            params: { word: encodeURIComponent(word.name) }
                        }}
                        className="block"
                    >
                        <Chip 
                            className="rounded-sm
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