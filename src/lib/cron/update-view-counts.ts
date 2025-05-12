import { db } from "@/db";
import { searchLogs } from "@/db/schema/search_logs";
import { words } from "@/db/schema/words";
import { eq, count } from "drizzle-orm";

export async function runUpdateViewCounts() {
  console.log("Starting cron job: runUpdateViewCounts");
  try {
    // 1. Aggregate counts from search_logs
    console.log("Aggregating view counts from search_logs...");
    const aggregatedCounts = await db
      .select({
        wordId: searchLogs.wordId,
        totalCount: count(searchLogs.id).mapWith(Number), // Ensure count is number
      })
      .from(searchLogs)
      .groupBy(searchLogs.wordId);

    console.log(`Found ${aggregatedCounts.length} words with new view logs.`);
    if (aggregatedCounts.length === 0) {
      console.log("No new view logs to process. Exiting cron job.");
      return;
    }

    // 2. Update words table within a transaction
    console.log("Starting transaction to update view counts in words table...");
    await db.transaction(async (tx) => {
      for (const { wordId, totalCount } of aggregatedCounts) {
        if (wordId === null) {
          console.warn("Skipping update for null wordId.");
          continue;
        }
        console.log(`Updating wordId ${wordId} with totalCount ${totalCount}`);
        await tx
          .update(words)
          .set({ viewCount: totalCount }) // Directly set the aggregated count
          .where(eq(words.id, wordId));
      }
    });

    console.log("Successfully updated view counts in words table.");

    // Optional: Add logic here later to delete old logs if needed
    // e.g., await db.delete(searchLogs).where(lt(searchLogs.searchTimestamp, ninetyDaysAgo));
    // console.log("Cleaned up old search logs.");

  } catch (error) {
    console.error("Error running updateViewCounts cron job:", error);
    // Re-throw the error so the API route knows it failed
    throw new Error("Failed to update view counts.");
  } finally {
    console.log("Finished cron job: runUpdateViewCounts");
  }
}
