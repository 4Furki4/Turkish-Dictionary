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
  Button,
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
import { toast } from "sonner";
import { Link as NextUILink } from "@nextui-org/react";
import { Link } from "@/src/navigation";
import { DashboardWordList } from "@/types";
import WordListDeleteModal from "./WordListDeleteModal";
export default function WordList(
  {
    words,
  }:
    {
      words: DashboardWordList[]
    }
) {
  const { isOpen: isDeleteModalOpen, onOpen: onDeleteModalOpen, onOpenChange: onDeleteModalChange } = useDisclosure();
  const [selectedWord, setSelectedWord] = React.useState<{
    wordId: number;
    name: string;
  }>({ wordId: 0, name: "" });
  const wordsQuery = api.word.getWords.useQuery({
    take: undefined,
    skip: undefined
  }, {
    initialData: words
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
    <section>
      <Table aria-label="Example table with dynamic content">
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody items={rows}>
          {(item) => (
            <TableRow key={item.key}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      <WordListDeleteModal key={selectedWord.wordId} isOpen={isDeleteModalOpen} onOpen={onDeleteModalOpen} onOpenChange={onDeleteModalChange} wordId={selectedWord.wordId} name={selectedWord.name} />
    </section>
  );
}
