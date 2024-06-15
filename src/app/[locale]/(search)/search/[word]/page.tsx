import React, { Suspense } from 'react'
import { api } from '@/src/trpc/server'
import WordCard from '@/src/components/customs/WordCard'
import { db } from '@/db';
import SearchResult from '@/src/_pages/search/SearchResult';
import Loading from '../_loading';

export const dynamic = "force-dynamic";

export async function generateMetadata({
    params: { word }
}: {
    params: { word: string }
}) {
    const parsedWord = decodeURIComponent(word) // parse the word to utf-8 format string
    if (word) {
        const response = await api.word.getWord(parsedWord);
        return {
            title: parsedWord,
            description: response[0]?.word_data.meanings.map((meaning) => meaning.meaning).join(", "),
        };
    }
}

export async function generateStaticParams() {
    const data = await db.query.words.findMany({
        columns: {
            name: true
        }
    })
    return data.map((word) => ({ word: word.name.split(" ").join("-") }))
}

export default function SearchResultPage({
    params: { locale, word }
}: {
    params: { locale: string, word: string }

}) {
    const formattedWord = decodeURI(word).trim().split("-").join(" ")
    return (
        <section className="flex flex-col gap-4 px-6 max-w-7xl mx-auto">
            <Suspense fallback={<Loading />}>
                <SearchResult word={formattedWord} locale={locale as "en" | "tr"} />
            </Suspense>
        </section>
    )

}
