"use client";
import React, { useCallback, useEffect } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  useDisclosure,
  Spinner,
  Button,
} from "@heroui/react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from "@heroui/react";
import { Edit3, MoreVertical, Plus, Trash2 } from "lucide-react";
import { api } from "@/src/trpc/react";
import { Link as NextUILink } from "@heroui/react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Link } from "@/src/i18n/routing";
import WordListDeleteModal from "./WordListDeleteModal";
import { Pagination } from "@heroui/pagination";
import { Select, SelectItem } from "@heroui/select";
import EditWordModal from "./EditModal/EditWordModal";
import { keepPreviousData } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { useDebounce } from "@uidotdev/usehooks";
import { Controller } from "react-hook-form";
import { Input } from "@heroui/react";

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
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onOpenChange: onDeleteModalChange } = useDisclosure();
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onOpenChange: onEditModalChange } = useDisclosure();
  const [selectedWord, setSelectedWord] = React.useState<{
    wordId: number;
    name: string;
  }>({ wordId: 0, name: "" });

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Get initial values from URL params
  const initialPage = Number(searchParams.get('page')) || 1;
  const initialPerPage = Number(searchParams.get('per_page')) || 10;
  const initialSearch = searchParams.get('search') || "";

  const [pageNumber, setPageNumber] = React.useState<number>(initialPage);
  const [wordsPerPage, setWordsPerPage] = React.useState<number>(initialPerPage);

  const { control, watch, setFocus } = useForm({
    defaultValues: {
      search: initialSearch
    }
  });

  // Update URL when parameters change
  const updateQueryParams = React.useCallback((params: { page?: number; per_page?: number; search?: string }) => {
    const newSearchParams = new URLSearchParams(searchParams);

    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        newSearchParams.set(key, value.toString());
      } else {
        newSearchParams.delete(key);
      }
    });

    router.push(`${pathname}?${newSearchParams.toString()}`);
  }, [pathname, router, searchParams]);

  // Handle parameter changes
  React.useEffect(() => {
    updateQueryParams({ page: pageNumber, per_page: wordsPerPage });
  }, [pageNumber, wordsPerPage, updateQueryParams]);

  const debouncedSearch = useDebounce(watch("search"), 500);

  React.useEffect(() => {
    if (debouncedSearch !== initialSearch) {
      updateQueryParams({ search: debouncedSearch || undefined, page: 1 });
      setFocus("search");
      setPageNumber(1); // Reset to first page on new search
    }
  }, [debouncedSearch, initialSearch, updateQueryParams]);

  const { data: wordCount } = api.word.getWordCount.useQuery({
    search: debouncedSearch
  })
  const { data: languages } = api.params.getLanguages.useQuery()
  const { data: partOfSpeechRaw } = api.params.getPartOfSpeeches.useQuery()
  const partOfSpeeches = partOfSpeechRaw?.map(pos => ({
    ...pos,
    id: pos.id.toString()
  })) ?? []
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
      label: "word",
    },
    {
      key: "meaning",
      label: "meaning",
    },
    {
      key: "actions",
      label: "Actions",
    },
  ];
  const renderCell = useCallback((item: Row, columnKey: React.Key) => {
    const cellValue = item[columnKey as keyof Row];
    switch (columnKey) {
      case "actions":
        return (
          <Dropdown>
            <DropdownTrigger key={cellValue} className="flex justify-around items-center">
              <button className="ml-auto">
                <MoreVertical aria-description="more action button" />
              </button>
            </DropdownTrigger>
            <DropdownMenu
              onAction={(key) => {
                if (key === "Delete") {
                  setSelectedWord({
                    wordId: item.key,
                    name: item.name,
                  });
                  onDeleteModalOpen();
                }
                if (key === "Edit") {
                  setSelectedWord({
                    wordId: item.key,
                    name: item.name,
                  });
                  onEditModalOpen();
                }
              }}
            >
              <DropdownSection title={"Actions"}>
                <DropdownItem
                  key={"Delete"}
                  startContent={<Trash2 />}
                  color={"danger"}
                >
                  Delete
                </DropdownItem>
                <DropdownItem key={'Edit'} startContent={<Edit3 />} color={"warning"}>
                  Edit
                </DropdownItem>
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>
        );
      case "name":
        return (
          <NextUILink target='_blank' as={Link} href={`/search/${item.name}`}>
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
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <NextUILink as={Link} href={"/dashboard/create-word"} className="w-fit">
              <Button
                startContent={<Plus className="w-4 h-4" />}
                color="primary"
                size="lg"
              >
                Create Word
              </Button>
            </NextUILink>
            <Controller name="search" control={control} render={({ field }) => (
              <Input {...field} placeholder="Search word" size="lg" />
            )}
            />
            <Select label={"Words per page"} defaultSelectedKeys={[wordsPerPage.toString()]}
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
        }} isCompact showControls total={totalPageNumber ?? 1} initialPage={pageNumber} onChange={async (page) => {
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

      <WordListDeleteModal key={`word-delete-modal-${selectedWord.wordId}-${selectedWord.name}`} isOpen={isDeleteModalOpen} onOpen={onDeleteModalOpen} onOpenChange={onDeleteModalChange} wordId={selectedWord.wordId} name={selectedWord.name} take={wordsPerPage} skip={(pageNumber - 1) * wordsPerPage} />
      <EditWordModal partOfSpeeches={partOfSpeeches ?? []} languages={languages ?? []} key={`word-edit-modal-${selectedWord.wordId}-${selectedWord.name}`} isOpen={isEditModalOpen} onOpen={onEditModalOpen} onOpenChange={onEditModalChange} wordName={selectedWord.name} wordsPerPage={wordsPerPage} skip={(pageNumber - 1) * wordsPerPage} />
    </section>
  );
}
