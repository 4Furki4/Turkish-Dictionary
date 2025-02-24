import WordList from '@/src/_pages/word-list/word-list'
import { api, HydrateClient } from '@/src/trpc/server'
import React from 'react'
import { Card, CardBody } from "@heroui/react";
import { getTranslations, setRequestLocale, unstable_setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

type Props = {
    params: Promise<{
        locale: string
    }>
    searchParams: Promise<SearchParams>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const locale = await params
    const t = await getTranslations({ locale, namespace: 'WordList' });
    return {
        title: t('title'),
        description: t('description'),
        openGraph: {
            title: t('title'),
            description: t('description'),
            type: 'website',
        },
    };
}

export default async function WordListPage({ params, searchParams }: Props) {
    const { locale } = await params
    setRequestLocale(locale as string)
    const search_params = await searchParams
    const page = Number(search_params.page) || 1;
    const perPage = Number(search_params.per_page) || 10;
    const search = search_params.search?.toString() || "";

    // Prefetch initial data
    void api.word.getWords.prefetch({
        take: perPage,
        skip: (page - 1) * perPage,
        search
    })
    void api.word.getWordCount.prefetch({ search })

    return (
        <Card className="max-w-7xl w-full mx-auto my-4" radius="sm">
            <CardBody>
                <HydrateClient>
                    <WordList />
                </HydrateClient>
            </CardBody>
        </Card>
    )
}
