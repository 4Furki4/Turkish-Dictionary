"use client";
import { useQuery, onlineManager } from "@tanstack/react-query";
import { getOfflineMetadata, getWordByNameOffline, searchByPattern } from "@/src/lib/offline-db";
import { useState, useEffect } from "react";
import { api } from "@/src/trpc/react";
import { OfflineInstallStatus, WordData } from "../lib/db-config";
import { isRateLimitError } from "@/src/lib/rate-limit-error";
import { cancelWordQueryLatency } from "@/src/lib/word-query-latency";

type WordDataWithSource = WordData & { source: "online" | "offline" };

type WordQueryData =
    | { data: WordData; source: "online" | "offline" }
    | { data: WordData[]; source: "offline" };

export const getOfflineWordSearchQueryKey = (wordName: string) =>
    ["word-offline", wordName] as const;

export const toOfflineWordSearchResult = (data: WordData): WordQueryData => ({
    data,
    source: "offline",
});

// Define a unified result type for our hook
type UseWordSearchResult = {
    data: WordDataWithSource | WordDataWithSource[] | undefined;
    isLoading: boolean;    // For the initial page skeleton
    isFetching: boolean;   // For the background "revalidate" spinner
    isError: boolean;      // For the "not found" state
    isOnline: boolean;     // For the "wifi off" icon
    offlineStatus: OfflineInstallStatus | "checking";
    hasOfflineDataset: boolean;
    isOfflineLoading: boolean;
    offlineError: Error | null;
    error: Error | null;
    searchOutcome: "no_result" | "error" | null;
    searchOutcomeSource: "online" | "offline";
};

type UseWordSearchOptions = {
    offlineOnly?: boolean;
};

const isNetworkFailure = (error: unknown): boolean => {
    const message = error instanceof Error ? error.message : String(error);
    return /fetch|network|load failed|econnrefused|eaddrnotavail|failed to fetch/i.test(message);
};

export function useWordSearch(
    wordName: string,
    options: UseWordSearchOptions = {},
): UseWordSearchResult {
    // State to track the network connection status
    const [isOnline, setIsOnline] = useState(() => {
        if (typeof window !== "undefined") {
            return navigator.onLine && onlineManager.isOnline();
        }
        return true; // Default to online on server
    });

    const trpcClient = api.useUtils().client;

    // Listen for online/offline events
    useEffect(() => {
        const updateOnlineStatus = () => {
            onlineManager.setOnline(navigator.onLine);
            const online = navigator.onLine && onlineManager.isOnline();
            setIsOnline(online);
        };

        updateOnlineStatus();
        window.addEventListener("online", updateOnlineStatus);
        window.addEventListener("offline", updateOnlineStatus);
        const unsubscribe = onlineManager.subscribe(updateOnlineStatus);

        return () => {
            window.removeEventListener("online", updateOnlineStatus);
            window.removeEventListener("offline", updateOnlineStatus);
            unsubscribe();
        };
    }, []);

    const isPatternSearch = wordName.includes("_");

    const {
        data: offlineMetadata,
        isLoading: isOfflineMetadataLoading,
        error: offlineMetadataError,
    } = useQuery({
        queryKey: ["offline-metadata"],
        queryFn: getOfflineMetadata,
        enabled: !!wordName,
        staleTime: 5 * 1000,
        gcTime: 1000 * 60 * 5,
        networkMode: "always",
        retry: false,
    });

    const hasOfflineDataset = Boolean(offlineMetadata?.activeVersion);

    // --- 1. OFFLINE QUERY ---
    const {
        data: offlineData,
        isLoading: isOfflineWordLoading,
        error: offlineWordError,
    } = useQuery({
        queryKey: getOfflineWordSearchQueryKey(wordName),
        queryFn: async () => {
            if (!wordName) return null;
            if (isPatternSearch) {
                const results = await searchByPattern(wordName);
                return results.length > 0 ? { data: results, source: "offline" as const } : null;
            }

            const data = await getWordByNameOffline(wordName);
            return data ? { data: data, source: "offline" as const } : null;
        },
        enabled: !!wordName && !isOfflineMetadataLoading && hasOfflineDataset,
        staleTime: Infinity,
        gcTime: 1000 * 60 * 5,
        networkMode: "always",
        retry: false,
    });

    const isOfflineLoading = isOfflineMetadataLoading || isOfflineWordLoading;
    const canUseOnlineSearch =
        isOnline &&
        !!wordName &&
        !isPatternSearch &&
        !options.offlineOnly &&
        !offlineData &&
        !isOfflineLoading;

    // --- 2. ONLINE QUERY ---
    // We skip online query if it is a pattern search
    const onlineQuery = useQuery({
        queryKey: ["word-online", wordName],
        queryFn: async () => {
            if (!wordName) return null;
            if (typeof navigator !== "undefined" && !navigator.onLine) {
                return null;
            }

            let onlineResult: Awaited<ReturnType<typeof trpcClient.word.getWord.query>>;
            try {
                onlineResult = await trpcClient.word.getWord.query({
                    name: wordName,
                });
            } catch (error) {
                if (isNetworkFailure(error)) {
                    onlineManager.setOnline(false);
                    setIsOnline(false);
                }

                throw error;
            }

            if (onlineResult && onlineResult.length > 0 && onlineResult[0]?.word_data) {
                return { data: onlineResult[0].word_data, source: "online" as const };
            }

            return null;
        },
        enabled: canUseOnlineSearch,
        staleTime: 15_000, // Combined with the 45s public server cache: at most 60s.
        networkMode: "online",
        retry: (failureCount, error) => {
            if (isRateLimitError(error)) return false;
            // The catch above has already moved network failures offline. A
            // queued retry would pause indefinitely and hide the failed lookup.
            if (isNetworkFailure(error)) return false;
            if (typeof navigator !== "undefined" && !navigator.onLine) {
                return false;
            }

            return failureCount < 1;
        },
    });

    // --- 3. COMBINE RESULTS ---

    // Prioritize "fresh" online data, fall back to "stale" offline data.
    // If pattern search, onlineQuery.data will be undefined (disabled).
    const data = (onlineQuery.data ?? offlineData) as WordQueryData | undefined;

    // We are "loading" ONLY if we have NO data to show yet,
    // and the relevant query is still running.
    const isLoading =
        !data && (canUseOnlineSearch ? onlineQuery.isLoading : isOfflineLoading);

    // We are in an "error" state ONLY if the online query failed
    // AND we also have no offline data to show as a fallback.
    // For pattern search, if offlineData is undefined, it's an error (no matches).
    const isError = isPatternSearch || options.offlineOnly || !isOnline
        ? !offlineData && !isOfflineLoading
        : !data && !isOfflineLoading && (onlineQuery.isError || onlineQuery.isSuccess);

    // We are "fetching" if we are online AND the online query is running,
    // (This includes the background revalidation)
    const isFetching = isOnline && onlineQuery.isFetching;

    const usesLocalSearch = isPatternSearch || Boolean(options.offlineOnly) || !isOnline;
    const onlineFailed = onlineQuery.isError && !isPatternSearch && !options.offlineOnly;
    let searchOutcome: UseWordSearchResult["searchOutcome"] = null;
    if (wordName && !data && !isLoading && !isOfflineLoading && !onlineQuery.isFetching && !onlineQuery.isPaused) {
        if (onlineFailed) {
            searchOutcome = "error";
        } else if (usesLocalSearch) {
            searchOutcome = !hasOfflineDataset || offlineWordError || offlineMetadataError ? "error" : "no_result";
        } else if (onlineQuery.isSuccess) {
            searchOutcome = "no_result";
        }
    }

    useEffect(() => {
        if (isError && !isLoading && !isOfflineLoading) cancelWordQueryLatency(wordName);
    }, [isError, isLoading, isOfflineLoading, wordName]);

    const resolvedData = data?.data
        ? Array.isArray(data.data)
            ? data.data.map((item) => ({ ...item, source: data.source }))
            : { ...data.data, source: data.source }
        : undefined;

    return {
        data: resolvedData as UseWordSearchResult["data"],
        isLoading,    // Use this for the main page skeleton
        isFetching,   // Use this for the small loading icon
        isError,      // Use this for "Not Found"
        isOnline,     // Use this to decide between loading icon and wifi-off icon
        offlineStatus: offlineMetadata?.status ?? "checking",
        hasOfflineDataset,
        isOfflineLoading,
        offlineError: (offlineWordError ?? offlineMetadataError) as Error | null,
        error: onlineQuery.error as Error | null,
        searchOutcome,
        searchOutcomeSource: onlineFailed ? "online" : usesLocalSearch ? "offline" : "online",
    };
}
