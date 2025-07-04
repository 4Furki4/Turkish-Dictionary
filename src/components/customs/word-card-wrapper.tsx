"use client"
import React from 'react'
import WordCard from './word-card';
import { Session } from 'next-auth';
import WordNotFoundCard from './word-not-found-card';
import { WordSearchResult } from '@/types';

export default function WordCardWrapper({ session, locale, data }: { session: Session | null, locale: "en" | "tr", data?: WordSearchResult[] }) {

    if (!data || data.length === 0) {
        return (
            <WordNotFoundCard
                session={session}
            />
        );
    }
    return data && data.length > 0 ? (
        data.map((word, index) => {
            // Ensure we have a valid unique key for each word card
            const uniqueKey = word.word_data?.word_id || `word-${index}`;
            return (
                <WordCard
                    key={uniqueKey}
                    word_data={word.word_data}
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
