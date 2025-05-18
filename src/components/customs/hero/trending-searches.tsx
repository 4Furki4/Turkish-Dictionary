"use client";

import React from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/src/trpc/react';
import { Chip } from '@heroui/react';
import { Link } from '@/src/i18n/routing';
import { TrendingUp } from 'lucide-react';

interface TrendingWord {
    id: number;
    name: string;
}

interface TrendingSearchesProps {
    period: '7days' | '30days';
}

export default function TrendingSearches({ period = '7days' }: TrendingSearchesProps) {
    const t = useTranslations('Components.TrendingSearches');

    const [trendingWords] = api.word.getPopularWords.useSuspenseQuery({
        limit: 6,
        period: period === '7days' ? 'last7Days' : 'last30Days'
    });

    return (
        <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">
                    {t(period === '7days' ? 'title7Days' : 'title30Days')}
                </h3>
            </div>
            <div className="flex flex-wrap gap-2">
                {trendingWords.map((word: TrendingWord) => (
                    <Link 
                        href={{
                            pathname: "/search/[word]",
                            params: { word: encodeURIComponent(word.name) }
                        }} 
                        key={word.id}
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
