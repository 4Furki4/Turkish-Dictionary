import React, { Suspense } from 'react'
import { api } from '@/src/trpc/server'
import { db } from '@/db';
import SearchResult from '@/src/_pages/search/SearchResult';
import Loading from '../_loading';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { words } from '@/db/schema/words';

export const dynamic = "force-dynamic";

export async function generateMetadata(
    props: {
        params: Promise<{ word: string, locale: string }>
    }
) {
    const params = await props.params;

    const {
        word,
        locale
    } = params;

    const parsedWord = decodeURIComponent(word) // parse the word to utf-8 format string
    const response = await api.word.getWord(parsedWord);
    const defString = response.length > 0 ? response[0].word_data.meanings.map((meaning, idx) => {
        return `${idx + 1}. ${meaning.meaning}:`
    }).join(" ") : "No definition found for this word"
    if (word) {
        const meta: Metadata = {
            title: locale === "en" ? `${parsedWord}` : `${parsedWord}`,
            description: locale === "en" ? `${parsedWord} definition: ${defString}` : `${parsedWord} kelimesinin anlamı: ${defString}`,
            keywords: `${parsedWord}, ${parsedWord} ne demek, ${parsedWord} anlamı`
        }

        return meta;
    }
}

export async function generateStaticParams() {
    const data = await db.query.words.findMany({
        columns: {
            name: true
        }
    })
    return data.map((word) => ({ word: word.name }))
}

export default async function SearchResultPage(
    props: {
        params: Promise<{ locale: string, word: string }>

    }
) {
    const params = await props.params;

    const {
        locale,
        word
    } = params;

    const formattedWord = decodeURI(word).trim()
    const response = await db.query.words.findMany({
        where: eq(words.name, formattedWord)
    })
    if (response.length === 0) {
        notFound()
    }
    return (
        <section className='p-6 mx-auto max-w-7xl w-full'>
            <Suspense fallback={<Loading />}>
                <SearchResult word={formattedWord} locale={locale as "en" | "tr"} />
            </Suspense>
        </section>
    )
}
