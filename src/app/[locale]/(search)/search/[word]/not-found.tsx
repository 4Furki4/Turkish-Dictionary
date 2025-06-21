// "use client";

import React from 'react';
import WordNotFoundCard from '@/src/components/customs/word-not-found-card';
import { auth } from '@/src/server/auth/auth';

export default async function NotFound({
    params
}: {
    params: Promise<{ locale: string, word: string }>
}) {
    const session = await auth()

    return (
        <WordNotFoundCard
            session={session}
        />
    );
}
