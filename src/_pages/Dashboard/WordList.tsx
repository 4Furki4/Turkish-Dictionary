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
import { SelectWord } from "@/db/schema/words";
import { SelectMeaning } from "@/db/schema/meanings";
type SelectWordWithMeanings = SelectWord & SelectMeaning
export default function WordList(
  //   {
  //   words,
  // }: {
  //   words: SelectWordWithMeanings[];
  // }
) {
  const wordsQuery = api.word.getWords.useQuery({
    take: undefined,
    skip: undefined
  })
  console.log(wordsQuery.data)
  // const wordMutation = api.admin.deleteWord.useMutation({
  //   onSuccess: async () => {
  //     await wordsQuery.refetch();
  //   },
  //   onError: (err) => {
  //     toast.error(err.message, {
  //       position: "top-center",
  //     });
  //   },
  // });
  // type Row = (typeof rows)[0];
  // const rows = wordsQuery.data.map((word, idx) => {
  //   return {
  //     name: word.name,
  //     key: idx,
  //     root: word.root,
  //     partOfSpeech: word.meanings[0].partOfSpeech,
  //     attributes: word.meanings[0].attributes?.join(", "),
  //     id: word.id,
  //   };
  // });
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
  // const renderCell = useCallback((item: Row, columnKey: React.Key) => {
  //   const cellValue = item[columnKey as keyof Row];
  //   switch (columnKey) {
  //     case "actions":
  //       return (
  //         <div className="flex">
  //           <Link
  //             className="hover:underline"
  //             href={{
  //               pathname: "/search",
  //               query: {
  //                 word: item.name,
  //               },
  //             }}
  //           >
  //             {`${item.name}`}
  //           </Link>
  //           <Dropdown>
  //             <DropdownTrigger className="w-full flex justify-around items-center">
  //               <button className="ml-auto">
  //                 <MoreVertical aria-description="more action button" />
  //               </button>
  //             </DropdownTrigger>
  //             <DropdownMenu
  //               onAction={(key) => {
  //                 if (key === "Delete") {
  //                   wordMutation.mutate({ id: item.id });
  //                 }
  //               }}
  //             >
  //               <DropdownSection title={"Actions"}>
  //                 <DropdownItem
  //                   key={"Delete"}
  //                   startContent={<Trash2 />}
  //                   color={"danger"}
  //                 >
  //                   Delete
  //                 </DropdownItem>
  //                 <DropdownItem startContent={<Edit3 />} color={"warning"}>
  //                   Edit
  //                 </DropdownItem>
  //               </DropdownSection>
  //             </DropdownMenu>
  //           </Dropdown>
  //         </div>
  //       );
  //     default:
  //       return cellValue;
  //   }
  // }, []);
  return (
    <section>
      {/* <NextUILink as={Link} href={"/dashboard/create"}>
        Create new word
      </NextUILink>
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
      </Table> */}
    </section>
  );
}
