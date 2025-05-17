import React, { Suspense } from 'react'
import { api } from '@/src/trpc/server';
import { db } from '@/db';
import SearchResult from '@/src/_pages/search/search-result';
import Loading from '../_loading';
import type { WordSearchResult } from '@/types';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { words } from '@/db/schema/words';

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

    const parsedWord = decodeURIComponent(word).trim();

    // --- Call tRPC procedure, skipping logging --- 
    const response = await api.word.getWord({ name: parsedWord, skipLogging: true });
    // Type the response properly and add null checks
    const typedResponse = response as unknown as WordSearchResult[];
    const wordExists = typedResponse.length > 0;
    const defString = wordExists &&
        typedResponse[0]?.word_data?.meanings &&
        Array.isArray(typedResponse[0].word_data.meanings) ?
        typedResponse[0].word_data.meanings.map((meaning, idx) => {
            return `${idx + 1}. ${meaning.meaning}:`
        }).join(" ") :
        "No definition found for this word";
    // --- End of tRPC call ---

    const isEnglish = locale === 'en';
    const title = parsedWord;
    const description = isEnglish 
        ? `${parsedWord} definition: ${defString}` 
        : `${parsedWord} kelimesinin anlamı: ${defString}`;

    if (wordExists) {
        return {
            title: title,
            description: description,
            keywords: isEnglish 
                ? [
                    parsedWord,
                    `${parsedWord} definition`,
                    `${parsedWord} meaning`,
                    'Turkish dictionary',
                    'Turkish words',
                    'learn Turkish',
                    'Turkish vocabulary'
                ] 
                : [
                    parsedWord,
                    `${parsedWord} ne demek`,
                    `${parsedWord} anlamı`,
                    'Türkçe sözlük',
                    'Türkçe kelimeler',
                    'Türkçe öğren',
                    'Türkçe kelime dağarcığı'
                ],
            openGraph: {
                title: isEnglish 
                    ? `${parsedWord} | Turkish Dictionary` 
                    : `${parsedWord} | Türkçe Sözlük`,
                description: description,
                type: 'website',
                locale: isEnglish ? 'en_US' : 'tr_TR',
                siteName: isEnglish ? 'Turkish Dictionary' : 'Türkçe Sözlük',
                url: `/${locale}/search/${encodeURIComponent(parsedWord)}`,
            },
            twitter: {
                card: 'summary_large_image',
                title: isEnglish 
                    ? `${parsedWord} | Turkish Dictionary` 
                    : `${parsedWord} | Türkçe Sözlük`,
                description: description,
            },
            alternates: {
                canonical: `/${locale}/search/${encodeURIComponent(parsedWord)}`,
                languages: {
                    'en': `/en/search/${encodeURIComponent(parsedWord)}`,
                    'tr': `/tr/search/${encodeURIComponent(parsedWord)}`,
                },
            },
        };
    }
    const notFoundTitle = isEnglish ? "Word Not Found" : "Kelime Bulunamadı";
    const notFoundDescription = isEnglish 
        ? "The word you searched for does not exist in our dictionary." 
        : "Aranan kelime sözlüğümüzde bulunamadı.";
    
    return {
        title: notFoundTitle,
        description: notFoundDescription,
        openGraph: {
            title: isEnglish 
                ? 'Word Not Found | Turkish Dictionary' 
                : 'Kelime Bulunamadı | Türkçe Sözlük',
            description: notFoundDescription,
            type: 'website',
            locale: isEnglish ? 'en_US' : 'tr_TR',
            siteName: isEnglish ? 'Turkish Dictionary' : 'Türkçe Sözlük',
            url: `/${locale}/search/${encodeURIComponent(parsedWord)}`,
        },
        twitter: {
            card: 'summary_large_image',
            title: isEnglish 
                ? 'Word Not Found | Turkish Dictionary' 
                : 'Kelime Bulunamadı | Türkçe Sözlük',
            description: notFoundDescription
        },
        alternates: {
            canonical: `/${locale}/search/${encodeURIComponent(parsedWord)}`,
            languages: {
                'en': `/en/search/${encodeURIComponent(parsedWord)}`,
                'tr': `/tr/search/${encodeURIComponent(parsedWord)}`,
            },
        },
    }
}

// export async function generateStaticParams() {
//     const data = await db.query.words.findMany({
//         columns: {
//             name: true
//         }
//     })
//     return data.map((word) => ({ word: word.name }))
// }

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

    // Properly decode URL parameters with special characters like commas
    const formattedWord = decodeURIComponent(word).trim()

    const response = await db.query.words.findMany({
        where: eq(words.name, formattedWord)
    })

    if (response.length === 0) {
        notFound()
    }
    return (
        <Suspense fallback={<Loading />}>
            <SearchResult word={formattedWord} locale={locale as "en" | "tr"} />
        </Suspense>
    )
}
