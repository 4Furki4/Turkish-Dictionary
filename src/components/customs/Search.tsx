"use client";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { useSearchParams } from "next/navigation";
import { Button, Card, CardBody, Input } from "@nextui-org/react";
import React, { useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "@/src/navigation";
import { SearchIcon } from "lucide-react";
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

        <div className="p-6 flex">
          <Input
            classNames={{
              inputWrapper: ["rounded-sm"]
            }}
            endContent={<button type="submit">
              <SearchIcon className="w-6 h-6" />
            </button>}
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
        </div>
      </form>
      {children}
    </>
  );
}
