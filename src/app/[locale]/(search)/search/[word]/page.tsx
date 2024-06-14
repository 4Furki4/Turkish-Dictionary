import SearchResult from '@/src/_pages/search/SearchResult'
import React, { Suspense } from 'react'
import Loading from '../loading'
import { api } from '@/src/trpc/server'
import WordCard from '@/src/components/customs/WordCard'

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


export default async function SearchResultPage({
    params: { locale, word }
}: {
    params: { locale: string, word: string }

}) {
    const formattedWord = decodeURI(word).trim().split("-").join(" ")
    const response = await api.word.getWord(formattedWord)
    const isSavedWords = await Promise.all(response.map(async (word) => {
        try {
            const isSaved = await api.user.getWordSaveStatus(word.word_data.word_id)
            return { wordId: word.word_data.word_id, isSaved: isSaved }
        } catch (error) {
            return { wordId: word.word_data.word_id, isSaved: false }
        }
    }))
    return <section className="flex flex-col gap-4 px-6 max-w-7xl mx-auto">
        {response.length > 0 ? (
            response.map((word) => <WordCard key={word.word_data.word_id} word={word} isSavedWord={isSavedWords.find((value) => value.wordId === word.word_data.word_id)!.isSaved} locale={locale as "en" | "tr"} />)
        ) : (
            <>
                <h1 className="text-center text-fs-3">{formattedWord}</h1>
                <p className="text-center text-fs-3">Word not found!</p>
            </>
        )}
    </section>

}
