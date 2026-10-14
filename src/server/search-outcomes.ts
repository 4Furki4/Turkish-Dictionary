import type { db } from "@/db";
import { searchOutcomes, searchOutcomeDailyTotals } from "@/db/schema/search_outcomes";
import { lt, sql } from "drizzle-orm";
import { SEARCH_OUTCOME_RETENTION_DAYS, type SearchOutcomeInput } from "@/src/lib/search-outcome-schema";

export async function recordSearchOutcome(database: Pick<typeof db, "transaction">, input: SearchOutcomeInput, now = new Date()) {
  return database.transaction(async tx => {
    await tx.execute(sql`SET LOCAL statement_timeout = '2s'`);
    await tx.execute(sql`SET LOCAL lock_timeout = '1s'`);
    const kind = input.query.includes("_") ? "pattern" as const : "word" as const;
    const inserted = await tx.insert(searchOutcomes).values({ ...input, kind, receivedAt: now })
      .onConflictDoNothing({ target: searchOutcomes.eventId }).returning({ eventId: searchOutcomes.eventId });
    if (inserted.length) {
      await tx.insert(searchOutcomeDailyTotals).values({
        day: now.toISOString().slice(0, 10), locale: input.locale,
        entryPoint: input.entryPoint, source: input.source, kind, outcome: input.outcome, count: 1,
      }).onConflictDoUpdate({
        target: [searchOutcomeDailyTotals.day, searchOutcomeDailyTotals.locale, searchOutcomeDailyTotals.entryPoint,
          searchOutcomeDailyTotals.source, searchOutcomeDailyTotals.kind, searchOutcomeDailyTotals.outcome],
        set: { count: sql`${searchOutcomeDailyTotals.count} + 1` },
      });
    }
    return { accepted: true as const };
  });
}

export async function pruneSearchOutcomes(database: Pick<typeof db, "transaction">, now = new Date()) {
  const cutoff = new Date(now.getTime() - SEARCH_OUTCOME_RETENTION_DAYS * 86_400_000);
  return database.transaction(async tx => {
    await tx.execute(sql`SET LOCAL statement_timeout = '30s'`);
    await tx.execute(sql`SET LOCAL lock_timeout = '1s'`);
    const deleted = await tx.delete(searchOutcomes).where(lt(searchOutcomes.receivedAt, cutoff));
    return { deleted: deleted.count };
  });
}
