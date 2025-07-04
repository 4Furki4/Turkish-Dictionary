"use client"
import { useQuery, onlineManager } from "@tanstack/react-query";

import { getWordByNameOffline, type WordData } from "@/src/lib/offline-db";
import { useState, useEffect } from "react";
import { api } from "@/src/trpc/react";

// Define a unified result type for our hook
type UseWordSearchResult = {
    data: (WordData & { source: "online" | "offline" }) | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
};

export function useWordSearch(wordName: string): UseWordSearchResult {
    // State to track the network connection status
    const [isOnline, setIsOnline] = useState(() => {
        if (typeof window !== 'undefined') {
            return navigator.onLine && onlineManager.isOnline();
        }
        return true; // Default to online on server
    });
    
    const trpcClient = api.useUtils().client;
    
    // Listen for online/offline events
    useEffect(() => {
        const updateOnlineStatus = () => {
            const online = navigator.onLine && onlineManager.isOnline();
            setIsOnline(online);
            console.log("Network status changed:", online ? "online" : "offline");
        };
        
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        
        // Also listen to onlineManager changes
        const unsubscribe = onlineManager.subscribe(updateOnlineStatus);
        
        return () => {
            window.removeEventListener('online', updateOnlineStatus);
            window.removeEventListener('offline', updateOnlineStatus);
            unsubscribe();
        };
    }, []);
    // useEffect(() => {
    //     // Set initial status and listen for changes
    //     setIsOnline(typeof navigator !== "undefined" && navigator.onLine);
    //     const handleOnline = () => setIsOnline(true);
    //     const handleOffline = () => setIsOnline(false);

    //     window.addEventListener("online", handleOnline);
    //     window.addEventListener("offline", handleOffline);

    //     return () => {
    //         window.removeEventListener("online", handleOnline);
    //         window.removeEventListener("offline", handleOffline);
    //     };
    // }, []);

    const { data, isLoading, isError, error } = useQuery({
        // The query key includes the word and online status, so it refetches if the connection changes
        queryKey: ["word", wordName, isOnline],
        queryFn: async () => {
            console.log(`Searching for word: "${wordName}", isOnline: ${isOnline}`);
            
            // --- Online First Strategy ---
            if (isOnline) {
                try {
                    // 1. Try fetching from the live tRPC API
                    const onlineResult = await trpcClient.word.getWord.query({ name: wordName });
                    console.log("Online result:", onlineResult);
                    
                    // The API returns an array like [{ word_data: {...} }]
                    if (onlineResult && onlineResult.length > 0 && onlineResult[0]?.word_data) {
                        // Return the data with its source marked as 'online'
                        return { ...onlineResult[0].word_data, source: "online" as const };
                    }
                } catch (e) {
                    console.warn("Online fetch failed, falling back to offline.", e);
                    // Check if it's a network error (connection issue)
                    const isNetworkError = e instanceof Error && (
                        e.message.includes('fetch') ||
                        e.message.includes('network') ||
                        e.message.includes('Failed to fetch') ||
                        e.name === 'TypeError'
                    );
                    
                    if (isNetworkError) {
                        console.log("Network error detected, switching to offline mode");
                        setIsOnline(false);
                    }
                    // Continue to offline fallback
                }
            }

            // --- Offline Fallback ---
            console.log("Attempting offline search...");
            try {
                const offlineData = await getWordByNameOffline(wordName);
                if (offlineData) {
                    console.log("Found offline data:", offlineData);
                    return { ...offlineData, source: "offline" as const };
                }
            } catch (offlineError) {
                console.error("Offline search failed:", offlineError);
            }

            // 3. If the word is not found in either source, throw an error.
            const errorMessage = isOnline 
                ? `The word "${wordName}" was not found online or offline.`
                : `The word "${wordName}" was not found in offline storage. Please download more words when online.`;
            throw new Error(errorMessage);
        },
        // Only run the query if a wordName is provided
        enabled: !!wordName,
        // Sensible defaults for stale time and retries
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 1,
    });

    return {
        data,
        isLoading,
        isError,
        error: error as Error | null,
    };
}
