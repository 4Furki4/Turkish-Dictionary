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
} from "@nextui-org/react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from "@nextui-org/react";
import { Edit3, MoreVertical, Trash2 } from "lucide-react";
import { api } from "@/src/trpc/react";
import { Link as NextUILink } from "@nextui-org/react";
import { Link } from "@/src/navigation";
import { DashboardWordList } from "@/types";
import WordListDeleteModal from "./WordListDeleteModal";
import { Pagination } from "@nextui-org/pagination";
import { Select, SelectSection, SelectItem } from "@nextui-org/select";
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
export default function WordList(
  {
    words,
    wordCount
  }:
    {
      words: DashboardWordList[],
      wordCount: number
    }
) {
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onOpenChange: onDeleteModalChange } = useDisclosure();
  const [selectedWord, setSelectedWord] = React.useState<{
    wordId: number;
    name: string;
  }>({ wordId: 0, name: "" });
  const [pageNumber, setPageNumber] = React.useState<number>(1);
  const [wordsPerPage, setWordsPerPage] = React.useState<number>(10);
  const wordCountQuery = api.word.getWordCount.useQuery(undefined, {
    initialData: wordCount
  });
  console.log('word count', wordCountQuery.data)
  console.log('page count', Math.ceil(wordCountQuery.data / wordsPerPage))
  const totalPageNumber = Math.ceil(wordCountQuery.data / wordsPerPage);
  const wordsQuery = api.word.getWords.useQuery({
    take: wordsPerPage,
    skip: (pageNumber - 1) * wordsPerPage
  }, {
    initialData: words,
  })
  type Row = (typeof rows)[0];
  const rows = wordsQuery.data.map((word, idx) => {
    return {
      name: word.name,
      key: word.word_id,
      meaning: word.meaning,
    };
  });
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
            <DropdownTrigger className="flex justify-around items-center">
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
                <DropdownItem startContent={<Edit3 />} color={"warning"}>
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
    <section className="w-full">
      <Select label={"Words per page"} defaultSelectedKeys={["10"]}
        size="sm"
        classNames={{
          base: ["flex ml-auto w-1/6"],
        }} onChange={(e) => {
          setWordsPerPage(parseInt(e.target.value));
        }}>
        {wordPerPageOptions.map((pageCount) => (
          <SelectItem key={pageCount.key}>
            {pageCount.label}
          </SelectItem>
        ))}
      </Select>
      <Table bottomContent={
        <Pagination classNames={{
          wrapper: ["mx-auto"]
        }} isCompact showControls total={totalPageNumber} initialPage={1} onChange={async (page) => {
          setPageNumber(page);
        }} />
      } classNames={{
        base: ["min-h-[300px]"],
      }} isStriped aria-label="Example table with dynamic content">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody items={rows}
          loadingContent={<Spinner />}
          loadingState={
            wordsQuery.isFetching ? "loading" : "idle"
          }
        >
          {(item) => (
            <TableRow key={item.key}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      <WordListDeleteModal key={selectedWord.wordId} isOpen={isDeleteModalOpen} onOpen={onDeleteModalOpen} onOpenChange={onDeleteModalChange} wordId={selectedWord.wordId} name={selectedWord.name} take={wordsPerPage} skip={(pageNumber - 1) * wordsPerPage} />
    </section>
  );
}
