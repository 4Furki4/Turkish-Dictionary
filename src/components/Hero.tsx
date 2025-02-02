"use client";
import { useTranslations } from "next-intl";
import { Search as SearchIcon } from "lucide-react";
import { useRouter } from "@/src/i18n/routing";
import { useSearchParams } from "next/navigation";
import { Input } from "@heroui/input";
import { toast } from "sonner";
import { useEffect, useState } from "react";

export default function Hero() {
  const t = useTranslations("Home");
  const params = useSearchParams();
  const router = useRouter();
  const [wordInput, setWordInput] = useState<string>("");
  const [inputError, setInputError] = useState<string>("");

  useEffect(() => {
    const warningParam = params.get("warning");
    if (warningParam === "alreadySignedIn") {
      toast.warning(t("alreadySignedIn"));
      router.replace("/");
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const input = wordInput.trim();
    if (!input) {
      setInputError(t("hero.searchError"));
      setWordInput("");
      return;
    }
    setWordInput("");
    setInputError("");
    const decodedInput = decodeURI(input);
    router.push({
      pathname: "/search/[word]",
      params: { word: decodedInput },
    });
  };

  return (
    <div className="relative isolate">
      {/* Background */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#F3AD9C] via-[#DC7266] to-[#8C0F19] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem] dark:from-[#DC7266] dark:via-[#BA3E3D] dark:to-[#64071F]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-12 pt-10 sm:pb-16 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl sm:leading-[5rem] bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
            {t("hero.title")}
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            {t("hero.description")}
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mt-8">
            <div className="relative">
              <Input
                classNames={{
                  inputWrapper: [
                    "rounded-sm",
                    "bg-background/80 dark:bg-background/60",
                    "backdrop-blur-sm",
                    "border-0",
                    "shadow-xl",
                    "hover:bg-background dark:hover:bg-background/80",
                    "group-data-[focused=true]:bg-background dark:group-data-[focused=true]:bg-background/80",
                    "group-data-[focus-visible=true]:ring-primary group-data-[focus-visible=true]:ring-offset-0",
                  ],
                  input: [
                    "py-6",
                    "text-base",
                    "text-foreground",
                    "placeholder:text-muted-foreground",
                  ]
                }}
                endContent={
                  <button
                    type="submit"
                    className="p-2 hover:bg-muted/50 rounded-full transition-colors"
                  >
                    <SearchIcon className="w-5 h-5 text-muted-foreground" />
                  </button>
                }
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
                placeholder={t("hero.searchPlaceholder")}
                isInvalid={!!inputError}
                errorMessage={inputError}
              />
            </div>
          </form>

          {/* Popular Searches */}
          {/*
          TODO: Implement dyanmic populer searches later.
          */}
          <div className="mt-6">
            <div className="text-sm text-muted-foreground">
              {t("hero.popularSearches")}
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {["merhaba", "kitap", "sevgi", "zaman"].map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setWordInput(term);
                    router.push({
                      pathname: "/search/[word]",
                      params: { word: term },
                    });
                  }}
                  className="
                    rounded-sm 
                    bg-background/80 dark:bg-background/60
                    backdrop-blur-sm
                    px-4 py-2 
                    text-sm font-medium 
                    text-foreground
                    shadow-sm 
                    ring-1 ring-border/50
                    hover:bg-background dark:hover:bg-background/80
                    transition-colors
                  "
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Background continued */}
      <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]">
        <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#F3AD9C] via-[#DC7266] to-[#8C0F19] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem] dark:from-[#DC7266] dark:via-[#BA3E3D] dark:to-[#64071F]" />
      </div>
    </div>
  );
}
