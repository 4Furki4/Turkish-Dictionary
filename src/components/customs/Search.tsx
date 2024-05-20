"use client";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";
import { Button, Card, CardBody, Input } from "@nextui-org/react";
import React, { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "@/src/navigation";
export default function Search({
  children,
  warningParamIntl,
}: {
  children: React.ReactNode;
  warningParamIntl: string;
}) {
  const params = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  useEffect(() => {
    const warningParam = params.get("warning");
    if (warningParam === "alreadySignedIn") {
      toast.warning(warningParamIntl);
      router.replace("/");
    }
  }, []);
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
          setInputError("")
          router.push({
            pathname: "/search",
            query: {
              word: formattedInput,
            },
          })
        }}
      >
        <Card className="my-4 bg-content1 text-primary-foreground">
          <CardBody className="flex-row gap-2 ">
            <Input
              aria-required
              autoFocus
              role="search"
              aria-label="search words"
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
