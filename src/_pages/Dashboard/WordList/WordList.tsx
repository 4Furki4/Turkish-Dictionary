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
import { DashboardWordList, Language } from "@/types";
import WordListDeleteModal from "./WordListDeleteModal";
import { Pagination } from "@nextui-org/pagination";
import { Select, SelectItem } from "@nextui-org/select";
import EditWordModal from "./EditModal/EditWordModal";
import { PartOfSpeech } from "@/db/schema/part_of_speechs";
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
    wordCount,
    languages,
    partOfSpeeches,
    meaningAttributes
  }:
    {
      words: DashboardWordList[],
      wordCount: number | undefined
      languages: Language[],
      partOfSpeeches: {
        id: string
        partOfSpeech: PartOfSpeech
      }[],
      meaningAttributes: {
        id: string,
        attribute: string
      }[]
    }
) {
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onOpenChange: onDeleteModalChange } = useDisclosure();
  const { isOpen: isEditModalOpen, onOpen: onEditModalOpen, onOpenChange: onEditModalChange } = useDisclosure();
  const [selectedWord, setSelectedWord] = React.useState<{
    wordId: number;
    name: string;
  }>({ wordId: 0, name: "" });
  const [pageNumber, setPageNumber] = React.useState<number>(1);
  const [wordsPerPage, setWordsPerPage] = React.useState<number>(10);
  const wordCountQuery = api.word.getWordCount.useQuery(undefined, {
    initialData: wordCount,
  });
  const totalPageNumber = wordCountQuery.data ? Math.ceil(wordCountQuery.data / wordsPerPage) : undefined;
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
        <Select label={"Words per page"} defaultSelectedKeys={["10"]}
          size="sm"
          classNames={{
            base: "flex ml-auto md:w-1/6",
          }} onChange={(e) => {
            setWordsPerPage(parseInt(e.target.value));
          }}>
          {wordPerPageOptions.map((pageCount) => (
            <SelectItem key={pageCount.key}>
              {pageCount.label}
            </SelectItem>
          ))}
        </Select>
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
            <TableRow key={item.key + item.name}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      <WordListDeleteModal key={`word-delete-modal-${selectedWord.wordId}-${selectedWord.name}`} isOpen={isDeleteModalOpen} onOpen={onDeleteModalOpen} onOpenChange={onDeleteModalChange} wordId={selectedWord.wordId} name={selectedWord.name} take={wordsPerPage} skip={(pageNumber - 1) * wordsPerPage} />
      <EditWordModal partOfSpeeches={partOfSpeeches} languages={languages} key={`word-edit-modal-${selectedWord.wordId}-${selectedWord.name}`} isOpen={isEditModalOpen} onOpen={onEditModalOpen} onOpenChange={onEditModalChange} wordName={selectedWord.name} meaningAttributes={meaningAttributes} />
    </section>
  );
}
