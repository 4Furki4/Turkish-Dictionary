"use client";
import { useTranslations } from "next-intl";
import { Edit3, HeartHandshake, Search as SearchIcon, Stars } from "lucide-react";
import { useRouter } from "@/src/i18n/routing";
import { useSearchParams } from "next/navigation";
import { Input } from "@heroui/input";
import { useEffect, useState } from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { api } from "@/src/trpc/react";
import { useDebounce } from "@uidotdev/usehooks";

export default function Hero({ children }: {
  children: React.ReactNode;
}) {
  const t = useTranslations("Home");
  const params = useSearchParams();
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

  // Reset selected index when recommendations change
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
      {/* Background */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div className="relative left-[calc(50%-11rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-linear-to-tr from-primary via-primary/75 to-primary/25 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-12 pt-10 sm:pb-16 lg:px-8">
        <div className="mx-auto text-center space-y-8">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl sm:leading-[5rem] bg-clip-text text-transparent bg-linear-to-r from-primary via-primary/80 to-primary/60 glow-text">
            {t("hero.title")}
          </h1>
          <p className="mt-6 text-lg leading-8">
            {t("hero.description")}
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mt-8">
            <div className="relative">
              <Input
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
                  // Delay hiding recommendations to allow click events
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

          {/* Search Results */}
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
          <div className="mt-6">
            <h3 className="text-sm">
              {t("hero.popularSearches")}
            </h3>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
              {["There", "Will", "Be", "Popular", "Searches", "Here"].map((term) => (
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
                    backdrop-blur-xs
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
        <div className="relative left-[calc(50%+3rem)] aspect-1155/678 w-[36.125rem] -translate-x-1/2 bg-linear-to-tr from-primary via-primary/75 to-primary/25 opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" />
      </div>
    </div >
  );
}

function FeatureCard({ title, description, icon }: { title: string, description: string, icon: React.ReactNode }) {
  return (
    <Card className="feature-card-shine bg-background/50 backdrop-blur-xs p-6 rounded-lg border border-border/50">
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