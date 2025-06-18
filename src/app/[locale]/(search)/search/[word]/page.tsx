import React, { Suspense } from 'react'
import { api } from '@/src/trpc/server';
import { db } from '@/db';
import SearchResult from '@/src/_pages/search/search-result';
import Loading from '../_loading';
import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { words } from '@/db/schema/words';
import { Metadata } from 'next';

// This is the updated metadata generation function
export async function generateMetadata({
    params,
}: {
    params: Promise<{ word: string, locale: string }>
}): Promise<Metadata> {
    const { word, locale } = await params;
    const wordName = decodeURIComponent(word);
    const [result] = await api.word.getWord({ name: wordName, skipLogging: true });
    if (!result) {
        return {
            title: "Kelime Bulunamadı",
            description: "Aradığınız kelime sözlükte bulunamadı.",
        };
    }


    const { word_data } = result
    const relatedWords = word_data?.relatedWords?.map((word) => word.related_word_name) || [];
    const relatedPhrases = word_data?.relatedPhrases?.map((phrase) => phrase.related_phrase) || [];
    const isEnglish = locale === "en";
    const firstMeaning = word_data.meanings[0]?.meaning || "";

    // SEO-optimized Title
    const title = isEnglish
        ? `What does "${word_data.word_name}" mean? Definition & Examples `
        : `"${word_data.word_name}" ne demek? Anlamı ve Örnek Cümleler`;

    // SEO-optimized Description
    const description = isEnglish
        ? `Official definition, pronunciation, and example sentences for the Turkish word "${word_data.word_name}": ${firstMeaning}. Learn more with our community-driven dictionary.`
        : `"${word_data.word_name}" kelimesinin resmi tanımı, okunuşu ve örnek cümleleri: ${firstMeaning}. Toplulukla gelişen sözlüğümüzle daha fazlasını öğrenin.`;

    // Combine them for the keywords tag
    const baseKeywords = isEnglish
        ? ['turkish dictionary', 'meaning of ' + word_data.word_name, 'turkish words']
        : ['türkçe sözlük', `${word_data.word_name} anlamı`, `${word_data.word_name} ne demek`, 'kelime anlamları'];

    const keywords = [word_data.word_name, ...baseKeywords, ...relatedWords, ...relatedPhrases];
    return {
        title,
        description,
        keywords,
        openGraph: {
            title: title,
            description: description,
            // Next.js will automatically find the opengraph-image.tsx in this directory
        },
        twitter: {
            title: title,
            description: description,
            // Twitter will also use the opengraph-image by default
        },
        alternates: {
            canonical: `/arama/${wordName}`,
            languages: {
                'en': `/en/search/${wordName}`,
                'tr': `/tr/arama/${wordName}`,
            },
        },
    };
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
