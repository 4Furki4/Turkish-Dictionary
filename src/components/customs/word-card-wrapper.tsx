"use client"
import React from 'react'
import { Session } from '@/src/lib/auth-client';
import { WordSearchResult } from '@/types';
import { SearchWordCardVariantGroup } from './search/word-card-variants';
import { useWordQueryLatency } from '@/src/hooks/use-word-query-latency';

export default function WordCardWrapper({ session, locale, data, isOnline, isWordFetching, headingLevel = "h2" }: { session: Session | null, locale: "en" | "tr", data?: WordSearchResult[], isOnline?: boolean, isWordFetching?: boolean, headingLevel?: "h1" | "h2" }) {
    useWordQueryLatency(
        data?.map(item => item.word_data.word_name) ?? [],
        isOnline === false || (data?.[0]?.word_data as { source?: string } | undefined)?.source === "offline" ? "offline" : "online",
    );
    return (
        <SearchWordCardVariantGroup
            data={data}
            locale={locale}
            session={session}
            isOnline={isOnline}
            isWordFetching={isWordFetching}
            headingLevel={headingLevel}
        />
    );
}
