"use client";
import { Button, Input } from "@nextui-org/react";
import React from "react";
import { useRouter } from "next-intl/client";

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [wordInput, setWordInput] = React.useState<string>("");
  const [inputError, setInputError] = React.useState<string>("");
  return (
    <>
      <form
        className="max-w-5xl mx-auto px-6"
        onSubmit={(e) => {
          e.preventDefault();
          const input: string = e.currentTarget.search.value;
          if (!input) {
            setInputError("Please enter a word to search");
            setWordInput("");
            return;
          }
          const formattedInput = input.trim();
          if (!formattedInput) {
            setInputError("Please enter a word to search");
            setWordInput("");
            return;
          }
          setWordInput("");
          setInputError("");
          router.push(`/search?word=${formattedInput}`);
        }}
      >
        <div className="flex">
          <Input
            value={wordInput}
            onValueChange={(val) => {
              setWordInput(val);
              if (val.trim()) setInputError("");
            }}
            color="primary"
            name="search"
            placeholder="Search Words..."
            isInvalid={!!inputError}
            errorMessage={inputError}
          />
          <Button type="submit">Search</Button>
        </div>
      </form>
      {children}
    </>
  );
}
