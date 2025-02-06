"use client";
import React, { useCallback } from "react";
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
import { Link } from "@/src/i18n/routing";
import { DashboardWordList, Language } from "@/types";
import WordListDeleteModal from "./WordListDeleteModal";
import { Pagination } from "@heroui/pagination";
import { Select, SelectItem } from "@heroui/select";
import EditWordModal from "./EditModal/EditWordModal";
import { keepPreviousData } from "@tanstack/react-query";

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
  const [pageNumber, setPageNumber] = React.useState<number>(1);
  const [wordsPerPage, setWordsPerPage] = React.useState<number>(10);

  const { data: wordCount } = api.word.getWordCount.useQuery()
  const { data: languages } = api.admin.getLanguages.useQuery()
  const { data: partOfSpeechRaw } = api.admin.getPartOfSpeeches.useQuery()
  const partOfSpeeches = partOfSpeechRaw?.map(pos => ({
    ...pos,
    id: pos.id.toString()
  })) ?? []
  const totalPageNumber = wordCount ? Math.ceil(wordCount / wordsPerPage) : undefined;
  const wordsQuery = api.word.getWords.useQuery({
    take: wordsPerPage,
    skip: (pageNumber - 1) * wordsPerPage
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
          <NextUILink as={'div'}>
            <Link target="_blank" href={{
              pathname: '/search/[word]',
              params: { word: item.name }
            }}>
              {cellValue}
            </Link>
          </NextUILink>
        );
      default:
        return cellValue;
    }
  }, []);
  return (
    <section>
      <Table topContent={
        <div className="flex gap-4">
          <NextUILink as={Link} href={'/dashboard/create-word'}>
            <Button variant="solid" color="primary" startContent={<Plus />} isIconOnly className="sm:hidden" />
            <Button variant="solid" color="primary" startContent={<Plus />} className="max-sm:hidden">
              Create Word
            </Button>
          </NextUILink>
          <Select label={"Words per page"} defaultSelectedKeys={["10"]}
            size="sm"
            classNames={{
              base: "ml-auto max-w-64",
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
      } bottomContent={
        <Pagination isDisabled={totalPageNumber === undefined} classNames={{
          wrapper: ["mx-auto"]
        }} isCompact showControls total={totalPageNumber ?? 1} initialPage={1} onChange={async (page) => {
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
