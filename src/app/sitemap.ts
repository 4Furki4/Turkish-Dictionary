import { db } from "@/db";
import { words } from "@/db/schema/words";
import { routing } from "@/src/i18n/routing";
import { desc } from "drizzle-orm";
import { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URL - update this with your production URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://turkish-dictionary-chi.vercel.app";

  // Create a sitemap array to store all URLs
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Add the base URL (homepage) with alternates
  sitemapEntries.push({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
    alternates: {
      languages: {
        en: `${baseUrl}/en`,
      },
    },
  });

  // Process each pathname from the routing configuration
  Object.entries(routing.pathnames).forEach(([internalPath, externalPath]) => {
    // Skip dynamic paths with parameters for now (they'd need data from DB)
    if (internalPath.includes("[") || typeof externalPath === "string") {
      return;
    }

    // Skip dashboard routes as they're disallowed in robots.txt
    if (
      internalPath.includes("/dashboard") ||
      (typeof externalPath === "object" &&
        (externalPath["tr"]?.includes("/dashboard") ||
          externalPath["tr"]?.includes("/panel")))
    ) {
      return;
    }

    // Get the localized paths
    const trPath = externalPath["tr"];
    const enPath = externalPath["en"];

    // Skip if no localized path is defined
    if (!trPath || !enPath || trPath.includes("[") || enPath.includes("[")) return;

    // Determine priority based on path importance
    let priority = 0.7;
    if (trPath.includes("/arama") || enPath.includes("/search")) {
      priority = 0.9;
    }

    // Add the Turkish URL (default) with English alternate
    sitemapEntries.push({
      url: `${baseUrl}${trPath.startsWith("/") ? "" : "/"}${trPath}`,
      lastModified: new Date(),
      changeFrequency: trPath.includes("/arama") ? "daily" : "weekly",
      priority,
      alternates: {
        languages: {
          en: `${baseUrl}/en${enPath.startsWith("/") ? "" : "/"}${enPath}`,
        },
      },
    });
  });

  // Fetch popular words from database (limit to 100 for performance)
  try {
    const popularWords = await db
      .select({ name: words.name })
      .from(words)
      .orderBy(desc(words.viewCount))
      .limit(100);
    
    // Remove duplicate word names
    const uniqueWordNames = [...new Set(popularWords.map(word => word.name))];
    
    // Generate sitemap entries for each unique word
    for (const wordName of uniqueWordNames) {
      // Get the localized search paths
      const searchPathnameConfig = routing.pathnames["/search/[word]"];
      if (typeof searchPathnameConfig !== "string") {
        const trSearchTemplate = searchPathnameConfig["tr"];
        const enSearchTemplate = searchPathnameConfig["en"];
        
        // Replace [word] with actual word name and encode it for URLs
        const encodedWordName = encodeURIComponent(wordName);
        const trWordPath = trSearchTemplate.replace("[word]", encodedWordName);
        const enWordPath = enSearchTemplate.replace("[word]", encodedWordName);
        
        // Create the sitemap entry with alternate
        sitemapEntries.push({
          url: `${baseUrl}${trWordPath.startsWith("/") ? "" : "/"}${trWordPath}`,
          lastModified: new Date(),
          changeFrequency: "daily",
          priority: 0.8,
          alternates: {
            languages: {
              en: `${baseUrl}/en${enWordPath.startsWith("/") ? "" : "/"}${enWordPath}`,
            },
          },
        });
      }
    }
  } catch (error) {
    console.error("Error fetching popular words for sitemap:", error);
    // Continue with static URLs only
  }

  return sitemapEntries;
}
