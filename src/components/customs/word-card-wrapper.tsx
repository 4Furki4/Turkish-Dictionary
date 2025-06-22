"use client"
import { api } from '@/src/trpc/react'
import React from 'react'
import WordCard from './word-card';
import { Session } from 'next-auth';
import WordNotFoundCard from './word-not-found-card';

export default function WordCardWrapper({ name, session, locale }: { name: string, session: Session | null, locale: "en" | "tr" }) {
    const [response] = api.word.getWord.useSuspenseQuery({ name }, {
        staleTime: 60 * 30 * 1000 // 30 minutes cache
    })

    if (!response || response.length === 0) {
        return (
            <WordNotFoundCard
                session={session}
            />
        );
    }
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
        <WordNotFoundCard
            session={session}
        />
    );
}
