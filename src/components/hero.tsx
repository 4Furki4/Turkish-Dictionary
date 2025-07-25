"use client";
import { useTranslations } from "next-intl";
import { Edit3, HeartHandshake, KeyboardIcon, Search as SearchIcon, Stars } from "lucide-react";
import { useRouter } from "@/src/i18n/routing";
import { Input } from "@heroui/input";
import { useEffect, useState } from "react";
import { Button, Card, CardBody, CardHeader, Popover, PopoverContent, PopoverTrigger, Tooltip } from "@heroui/react";
import { api } from "@/src/trpc/react";
import { useDebounce } from "@uidotdev/usehooks";
import PopularSearches from "./customs/hero/popular-searches";
import TrendingSearchesContainer from "./customs/hero/trending-searches-container";
import { useSnapshot } from "valtio";
import { preferencesState } from "../store/preferences";
import { cn } from "@/lib/utils";
import { TurkishKeyboard } from "./customs/utils/TurkishKeyboard";

export default function Hero({ children }: {
  children: React.ReactNode;
}) {
  const t = useTranslations("Home");
  const router = useRouter();
  const [wordInput, setWordInput] = useState<string>("");
  const [inputError, setInputError] = useState<string>("");
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const debouncedInput = useDebounce(wordInput, 300);

  const { data: recommendations, isLoading } = api.word.getRecommendations.useQuery(
    { query: debouncedInput, limit: 5 },
    {
      enabled: debouncedInput.length > 0,
      refetchOnWindowFocus: false
    }
  );

  useEffect(() => {
    setSelectedIndex(-1);
  }, [recommendations]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!recommendations?.length) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < recommendations.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex(prev => prev > -1 ? prev - 1 : prev);
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleRecommendationClick(recommendations[selectedIndex].name);
        } else {
          handleSearch(e as unknown as React.FormEvent);
        }
        break;
      case "Escape":
        setShowRecommendations(false);
        setSelectedIndex(-1);
        break;
    }
  };

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
    router.push({
      pathname: "/search/[word]",
      params: { word: input },
    });
  };

  const handleRecommendationClick = (word: string) => {
    setWordInput(word);
    setShowRecommendations(false);
    router.push({
      pathname: "/search/[word]",
      params: { word: word },
    });
  };

  return (
    <div className="relative isolate">
      <div className="mx-auto max-w-7xl px-2 pb-12 pt-10 sm:pb-16 lg:px-8">
        <div className="mx-auto text-center space-y-4">
          <div className="mx-auto max-w-3xl">
            <h1 className="text-fs-4 font-bold tracking-tight sm:text-6xl sm:leading-[5rem] bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary/60">
              {t("hero.title")}
            </h1>
            <p className="mt-4 text-fs-0 leading-8 text-muted-foreground sm:text-fs-1">
              {t("hero.motto")}
            </p>
          </div>

          {/* Search Form */}
          <div className="mt-8"> {/* Increased top margin */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Input
                  endContent={
                    <Popover placement="bottom-end" classNames={{
                      content: "bg-background"
                    }}>
                      <PopoverTrigger>
                        <Button className="bg-transparent" isIconOnly variant="flat" radius="none">
                          <Tooltip content={t("hero.turkishLetters")}>
                            <KeyboardIcon className="text-default-400" />
                          </Tooltip>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="grid grid-cols-3 gap-1">
                        <TurkishKeyboard className="bg-background/50 border border-border" onCharClick={(char) => setWordInput((prev) => prev + char)} />
                      </PopoverContent>
                    </Popover>
                  }
                  classNames={{
                    inputWrapper: [
                      "rounded-sm",
                      "backdrop-blur-xs",
                      "border-2 border-primary/40",
                      "shadow-xl",
                      "group-data-[hover=true]:border-primary/60",
                    ],
                    input: [
                      "py-6",
                      "text-base",
                      "text-foreground",
                      "placeholder:text-muted-foreground",
                    ]
                  }}
                  startContent={
                    <button
                      type="submit"
                      className="p-2 hover:bg-muted/50 rounded-full transition-colors"
                      aria-label="search button"
                    >
                      <SearchIcon className="w-5 h-5 text-muted-foreground" />
                    </button>
                  }
                  aria-required
                  autoFocus
                  aria-label="search words"
                  value={wordInput}
                  onKeyDown={handleKeyDown}
                  onValueChange={(val) => {
                    setWordInput(val);
                    if (val.trim()) {
                      setInputError("");
                      setShowRecommendations(true);
                    } else {
                      setShowRecommendations(false);
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => {
                      setShowRecommendations(false);
                      setSelectedIndex(-1);
                    }, 200);
                  }}
                  color="primary"
                  variant="bordered"
                  name="search"
                  placeholder={t("hero.searchPlaceholder")}
                  isInvalid={!!inputError}
                  errorMessage={inputError}
                  type="search"
                />
                {showRecommendations && isLoading && (
                  <div className="absolute z-10 w-full mt-1 bg-background/90 backdrop-blur-xs border border-primary/20 rounded-md shadow-lg text-left border-b-0 p-2">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="h-6 px-4 py-2 bg-muted-foreground/20 rounded-sm my-2 animate-pulse"
                      />
                    ))}
                  </div>
                )}
                {showRecommendations && recommendations && recommendations.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background/90 backdrop-blur-xs border border-primary/20 rounded-md shadow-lg text-left border-b-0">
                    <ul role="listbox">
                      {recommendations.map((rec, index) => (
                        <li
                          key={rec.word_id}
                          role="option"
                          aria-selected={index === selectedIndex}
                          className={`px-4 py-2 cursor-pointer transition-colors border-b border-primary/20 ${index === selectedIndex
                            ? "bg-primary/30"
                            : "hover:bg-primary/10"
                            }`}
                          onClick={() => handleRecommendationClick(rec.name)}
                          onMouseEnter={() => setSelectedIndex(index)}
                        >
                          {rec.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </form>
          </div>

          <>
            {children}
          </>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <FeatureCard title={t("hero.feature1.title")} description={t("hero.feature1.description")} icon={<HeartHandshake className="w-6 h-6 text-primary" />} />
            <FeatureCard title={t("hero.feature2.title")} description={t("hero.feature2.description")} icon={<Edit3 className="w-6 h-6 text-warning" />} />
            <FeatureCard title={t("hero.feature3.title")} description={t("hero.feature3.description")} icon={<Stars className="w-6 h-6 text-yellow-400" />} />
          </div>

          {/* Popular Searches */}
          <PopularSearches />

          {/* Trending Searches */}
          <TrendingSearchesContainer />
        </div>
      </div>
    </div >
  );
}

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
  const { isBlurEnabled } = useSnapshot(preferencesState);
  return (
    <Card isBlurred={isBlurEnabled} className={cn("bg-background/50 p-6 rounded-lg border border-border/50", isBlurEnabled && "backdrop-blur-xl feature-card-shine")}>
      <CardHeader className="flex flex-col gap-2">
        {icon}
        <h2 className="text-lg font-semibold text-foreground">
          {title}
        </h2>
      </CardHeader>
      <CardBody>
        <p className="mt-4 text-base text-muted-foreground">
          {description}
        </p>
      </CardBody>
    </Card>
  );
}
