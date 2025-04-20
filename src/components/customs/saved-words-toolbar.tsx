"use client";

import React, { useState, useEffect } from "react";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { ArrowDownAZ, ArrowDownZA } from "lucide-react";
import { useTranslations } from "next-intl";

export type ViewType = "list" | "grid";
export type AlphabetOrder = "az" | "za";
export type DateOrder = "dateAsc" | "dateDesc";

interface SavedWordsToolbarProps {
  onSearch: (value: string) => void;
  onAlphabetSort: (sort: AlphabetOrder) => void;
  onDateSort: (sort: DateOrder) => void;
  perPage: number;
  onPerPageChange: (value: number) => void;
}
const alphabetOptions = [
  { key: "az", label: "AZ" },
  { key: "za", label: "ZA" }
]
const dateOptions = [
  { key: "dateAsc", label: "Date (Ascending)" },
  { key: "dateDesc", label: "Date (Descending)" }
]
const wordPerPageOptions = [
  {
    label: "6",
    key: "6"
  },
  {
    label: "12",
    key: "12"
  },
  {
    label: "24",
    key: "24"
  },
  {
    label: "48",
    key: "48"
  }
]
export default function SavedWordsToolbar({ onSearch, onAlphabetSort, onDateSort, perPage, onPerPageChange }: SavedWordsToolbarProps) {
  const t = useTranslations("SavedWords.Toolbar");
  const [search, setSearch] = useState("");
  const [sortAlphabet, setSortAlphabet] = useState<AlphabetOrder>("az");
  const [sortDate, setSortDate] = useState<DateOrder>("dateAsc");
  useEffect(() => {
    const handler = setTimeout(() => {
      onSearch(search);
    }, 300);
    return () => clearTimeout(handler);
  }, [search, onSearch]);

  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-background border border-border rounded-sm">
      <div className="flex-1 min-w-[200px]">
        <Input
          value={search}
          onValueChange={setSearch}
          placeholder={t("searchPlaceholder")}
        />
      </div>
      <div className="flex-1 min-w-[150px]">
        <Select
          placeholder={t("sortPlaceholder")}
          startContent={sortAlphabet === "az" ? <ArrowDownAZ /> : <ArrowDownZA />}
          defaultSelectedKeys={["az"]}
          onChange={(e) => {
            const val = (e.target as HTMLSelectElement).value as AlphabetOrder;
            setSortAlphabet(val);
            onAlphabetSort(val);
          }}
        >
          {alphabetOptions.map((option) => (
            <SelectItem key={option.key} value={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </Select>
      </div>
      <div className="flex-1 min-w-[150px]">
        <Select
          placeholder={t("sortPlaceholder")}
          defaultSelectedKeys={["dateAsc"]}
          onChange={(e) => {
            const val = (e.target as HTMLSelectElement).value as DateOrder;
            setSortDate(val);
            onDateSort(val);
          }}
        >
          {dateOptions.map((option) => (
            <SelectItem key={option.key} value={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </Select>
      </div>
      <div className=" min-w-[150px] ml-auto">
        <Select
          placeholder={t("pagination.wordsPerPage")}
          defaultSelectedKeys={[wordPerPageOptions.find((option) => option.key === perPage.toString())?.key ?? perPage.toString()]}
          classNames={{
            base: "ml-auto"
          }}
          onChange={(e) => onPerPageChange(Number((e.target as HTMLSelectElement).value))}
        >
          {wordPerPageOptions.map((option) => (
            <SelectItem key={option.key} value={option.key}>
              {option.label}
            </SelectItem>
          ))}
        </Select>
      </div>
    </div>
  );
}
