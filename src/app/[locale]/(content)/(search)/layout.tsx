"use client";
import { Button, Card, CardBody, CardHeader, Input } from "@nextui-org/react";
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
        className="max-w-5xl mx-auto"
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
        <Card className="my-4 bg-content1 text-primary-foreground">
          <CardBody className="flex-row gap-2 ">
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
            <Button color="primary" variant="ghost" type="submit">
              Search
            </Button>
          </CardBody>
        </Card>
      </form>
      {children}
    </>
  );
}
