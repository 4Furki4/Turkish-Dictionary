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
                    <NextUILink target="_blank" color="primary" underline="hover" as={Link} href={`/search/${item.name}`}>
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
                            <Input
                                type="search"
                                color="primary"
                                variant="bordered"
                                classNames={{
                                    inputWrapper: [
                                        "rounded-sm",
                                        "backdrop-blur-xs",
                                        "border-2 border-primary/40",
                                        "shadow-xl",
                                        "group-data-[hover=true]:border-primary/60",
                                    ],
                                    input: [
                                        "py-6",
                                        "text-base",
                                        "text-foreground",
                                        "placeholder:text-muted-foreground",
                                    ]
                                }}
                                {...field} placeholder={t('searchPlaceholder')} size="lg" />
                        )}
                        />
                        <Select label={t('wordsPerPage')} defaultSelectedKeys={[wordsPerPage.toString()]}
                            size="sm"
                            color="primary"
                            variant="bordered"
                            classNames={{
                                base: "ml-auto sm:max-w-64",
                                trigger: "border-2 border-primary/40",
                                label: "text-foreground",
                                listbox: "bg-background/10",
                                popoverContent: "bg-background border-primary/40",

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
                    wrapper: "mx-auto",
                    item: "bg-primary/10 p-1 min-w-max",
                    next: "bg-primary/10",
                    prev: "bg-primary/10",
                }} isCompact showControls className="cursor-pointer" total={totalPageNumber ?? 1} initialPage={1} page={pageNumber} onChange={async (page) => {
                    setPageNumber(page);
                }} />
            } classNames={{
                base: ["min-h-[300px]"],
                wrapper: "flex flex-col relative overflow-hidden h-auto text-foreground box-border outline-hidden data-[focus-visible=true]:z-10 data-[focus-visible=true]:outline-2 data-[focus-visible=true]:outline-focus data-[focus-visible=true]:outline-offset-2 shadow-medium bg-background/10  backdrop-blur-md backdrop-saturate-150 transition-transform-background motion-reduce:transition-none border-2 border-border rounded-sm p-2 w-full",
                td: "group-data-[odd=true]/tr:before:bg-primary/10 group-data-[odd=true]/tr:before:opacity-100",
                th: "bg-primary/10",
            }} isCompact isStriped aria-label="Example table with dynamic content">
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
        </section >
    );
}
