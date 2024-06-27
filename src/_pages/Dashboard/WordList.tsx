"use client";
import React, { useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
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
export default function WordList(
  {
    words,
  }:
    {
      words: DashboardWordList[]
    }
) {
  const wordsQuery = api.word.getWords.useQuery({
    take: undefined,
    skip: undefined
  })
  console.log(wordsQuery.data)
  const deleteMutation = api.admin.deleteWord.useMutation({
    onSuccess: async () => {
      await wordsQuery.refetch();
    },
    onError: (err) => {
      toast.error(err.message, {
        position: "top-center",
      });
    },
  });
  type Row = (typeof rows)[0];
  const rows = words.map((word, idx) => {
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
                  deleteMutation.mutate({ id: item.key });
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
    </section>
  );
}
