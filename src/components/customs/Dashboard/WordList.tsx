"use client";
import { Word } from "@/types";
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
export default function WordList({ words }: { words: Word[] }) {
  type Row = (typeof rows)[0];
  const rows = words.map((word, idx) => {
    return {
      name: word.name,
      key: idx,
      root: word.root,
      partOfSpeech: word.meanings[0].partOfSpeech,
      attributes: word.meanings[0].attributes.join(", "),
    };
  });
  const columns = [
    {
      key: "name",
      label: "Word",
    },
    {
      key: "partOfSpeech",
      label: "Part of Speech",
    },
    {
      key: "attributes",
      label: "Attributes",
    },
    {
      key: "root",
      label: "Root",
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
            <DropdownTrigger className="flex">
              <button className="ml-auto">
                <MoreVertical aria-description="more action button" />
              </button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownSection title={"Actions"}>
                <DropdownItem startContent={<Trash2 />} color={"danger"}>
                  Delete
                </DropdownItem>
                <DropdownItem startContent={<Edit3 />} color={"warning"}>
                  Edit
                </DropdownItem>
              </DropdownSection>
            </DropdownMenu>
          </Dropdown>
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
