"use client"
import { api } from '@/src/trpc/react'
import React from 'react'
import WordCard from './word-card';
import { Session } from 'next-auth';
import { useTranslations } from 'next-intl';
import { Link as NextIntlLink } from "@/src/i18n/routing";
export default function WordCardWrapper({ name, session, locale }: { name: string, session: Session | null, locale: "en" | "tr" }) {
    const [response] = api.word.getWord.useSuspenseQuery({ name }, {
        staleTime: 60 * 30 * 1000 // 30 minutes cache
    })
    const t = useTranslations('SearchResults')
    if (!response || response.length === 0) return (
        <>
            <h1 className="text-center text-fs-3">{name}</h1>
            <p className="text-center text-fs-3">
                {t('NoMeaningError')}
            </p>
            {/* TODO: change here when contact page is ready. */}
            <NextIntlLink href="/" locale={locale}>
                {t('Contact')}
            </NextIntlLink>
        </>
    )
    return response && response.length > 0 ? (
        response.map((word, index) => {
            // Ensure we have a valid unique key for each word card
            const uniqueKey = word.word_data?.word_id || `word-${index}`;
            return (
                <WordCard
                    key={uniqueKey}
                    word={word}
                    locale={locale}
                    session={session}
                />
            );
        })
    ) : (
        <>
            <h1 className="text-center text-fs-3">{name}</h1>
            <p className="text-center text-fs-3">
                {t('NoMeaningError')}
            </p>
            {/* TODO: change here when contact page is ready. */}
            <NextIntlLink href="/" locale={locale}>
                {t('Contact')}
            </NextIntlLink>
        </>
    );
}
