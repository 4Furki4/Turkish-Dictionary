"use client";
import React, { useCallback, useEffect, useRef } from "react";
import {
    Table,
    TableHeader,
    TableColumn,
    TableBody,
    TableRow,
    TableCell,
    Spinner,
    Input,
} from "@heroui/react";
import { api } from "@/src/trpc/react";
import { Link as NextUILink } from "@heroui/react";
import { Link } from "@/src/i18n/routing";
import { Pagination } from "@heroui/pagination";
import { Select, SelectItem } from "@heroui/select";
import { keepPreviousData } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { useDebounce } from "@uidotdev/usehooks";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

const wordPerPageOptions = [
    {
        label: "5",
        key: "5"
    },
    {
        label: "10",
        key: "10"
    },
    {
        label: "20",
        key: "20"
    },
    {
        label: "50",
        key: "50"
    }
]

export default function WordList() {
    const t = useTranslations('WordList');
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Get initial values from URL params
    const initialPage = Number(searchParams.get('page')) || 1;
    const initialPerPage = Number(searchParams.get('per_page')) || 10;
    const initialSearch = searchParams.get('search') || "";

    const [pageNumber, setPageNumber] = React.useState<number>(initialPage);
    const [wordsPerPage, setWordsPerPage] = React.useState<number>(initialPerPage);

    const { control, watch, setValue } = useForm({
        defaultValues: {
            search: initialSearch
        }
    });

    const debouncedSearch = useDebounce(watch("search"), 500);
    const isFirstRender = useRef(true);

    // reset to first page when search changes
    useEffect(() => {
        setPageNumber(1);
    }, [debouncedSearch]);

    // update state on URL param changes (back/forward)
    useEffect(() => {
        if (isFirstRender.current) return;
        const paramPage = Number(searchParams.get('page')) || 1;
        const paramPer = Number(searchParams.get('per_page')) || 10;
        const paramSearch = searchParams.get('search') || '';
        setPageNumber(paramPage);
        setWordsPerPage(paramPer);
        setValue('search', paramSearch, { shouldDirty: false });
    }, [searchParams, setValue]);

    // sync state to URL, enable back/forward history
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const params = new URLSearchParams();
        if (debouncedSearch) params.set('search', debouncedSearch);
        params.set('page', pageNumber.toString());
        params.set('per_page', wordsPerPage.toString());
        router.push(`${pathname}?${params.toString()}`);
    }, [pageNumber, wordsPerPage, debouncedSearch, pathname, router]);

    const { data: wordCount } = api.word.getWordCount.useQuery({
        search: debouncedSearch
    })

    const totalPageNumber = wordCount ? Math.ceil(wordCount / wordsPerPage) : undefined;
    const wordsQuery = api.word.getWords.useQuery({
        take: wordsPerPage,
        skip: (pageNumber - 1) * wordsPerPage,
        search: debouncedSearch
    }, {
        placeholderData: keepPreviousData
    })

    type Row = (typeof rows)[0];
    const rows = wordsQuery.data?.map((word, idx) => {
        return {
            name: word.name,
            key: word.word_id,
            meaning: word.meaning,
        };
    }) || []

    const columns = [
        {
            key: "name",
            label: t('columns.word'),
        },
        {
            key: "meaning",
            label: t('columns.meaning'),
        },
    ];

    const renderCell = useCallback((item: Row, columnKey: React.Key) => {
        const cellValue = item[columnKey as keyof Row];
        switch (columnKey) {
            case "name":
                return (
                    <NextUILink as={Link} href={`/search/${item.name}`}>
                        {cellValue}
                    </NextUILink>
                );
            default:
                return cellValue;
        }
    }, []);

    return (
        <section>

            <Table topContent={
                <div className="flex flex-col gap-4">
                    <h1 className="text-fs-1">
                        {t('title')}
                    </h1>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <Controller name="search" control={control} render={({ field }) => (
                            <Input {...field} placeholder={t('searchPlaceholder')} size="lg" />
                        )}
                        />
                        <Select label={t('wordsPerPage')} defaultSelectedKeys={[wordsPerPage.toString()]}
                            size="sm"
                            classNames={{
                                base: "ml-auto sm:max-w-64",
                            }} onChange={(e) => {
                                setWordsPerPage(parseInt(e.target.value));
                            }}>
                            {wordPerPageOptions.map((pageCount) => (
                                <SelectItem key={pageCount.key}>
                                    {pageCount.label}
                                </SelectItem>
                            ))}
                        </Select>
                    </div>
                </div>
            } bottomContent={
                <Pagination isDisabled={totalPageNumber === undefined} classNames={{
                    wrapper: ["mx-auto"]
                }} isCompact showControls total={totalPageNumber ?? 1} initialPage={1} page={pageNumber} onChange={async (page) => {
                    setPageNumber(page);
                }} />
            } classNames={{
                base: ["min-h-[300px]"],
            }} isStriped aria-label="Example table with dynamic content">
                <TableHeader columns={columns}>
                    {(column) => (
                        <TableColumn align={column.key === "actions" ? "end" : "start"} key={column.key}>{column.label}</TableColumn>
                    )}
                </TableHeader>
                <TableBody items={rows}
                    loadingContent={<Spinner />}
                    loadingState={
                        wordsQuery.isFetching ? "loading" : "idle"
                    }
                >
                    {(item) => (
                        <TableRow key={item.key + item.name}>
                            {(columnKey) => (
                                <TableCell>{renderCell(item, columnKey)}</TableCell>
                            )}
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </section>
    );
}
