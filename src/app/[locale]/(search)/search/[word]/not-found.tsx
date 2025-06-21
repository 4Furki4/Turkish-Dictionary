"use client";

import React from 'react';
import { useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import WordNotFoundCard from '@/src/components/customs/word-not-found-card';

export default function NotFound() {
    const params = useParams();
    const { data: session } = useSession();

    // Extract word and locale from URL parameters
    const word = params.word as string;
    const locale = params.locale as "en" | "tr";

    // Decode the word parameter
    const wordName = word ? decodeURIComponent(word) : "Unknown";

    return (
        <div className="container mx-auto">
            <WordNotFoundCard
                wordName={wordName}
                locale={locale || "en"}
                session={session}
            />
        </div>
    );
}
