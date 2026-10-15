import type { db } from "@/db";
import { words } from "@/db/schema/words";
import { meanings } from "@/db/schema/meanings";
import { examples } from "@/db/schema/examples";
import { pronunciations } from "@/db/schema/pronunciations";
import { pronunciationAssets, wordPronunciationAudio } from "@/db/schema/pronunciation_assets";
import { roots } from "@/db/schema/roots";
import { wordSources } from "@/db/schema/word_sources";
import { searchLogs } from "@/db/schema/search_logs";
import { and, asc, count, desc, eq, gte, ilike, lt, sql, type SQLWrapper } from "drizzle-orm";
import { contentQualityInputSchema, type ContentQualityInput } from "./api/schemas/content-quality";
import { getDashboardWindow } from "./dashboard-window";

type Database = Pick<typeof db, "select" | "selectDistinctOn" | "$with" | "with">;

export async function getContentQuality(database: Database, raw: ContentQualityInput, now = new Date()) {
  const input = contentQualityInputSchema.parse(raw);
  const generatedAt = input.asOf ?? now;
  const window = getDashboardWindow(input.selection, generatedAt);
  const demand = database.$with("quality_demand").as(database.select({ wordId: searchLogs.wordId,
    searches: count().as("searches"),
  }).from(searchLogs).where(and(gte(searchLogs.searchTimestamp, window.start), lt(searchLogs.searchTimestamp, window.end))).groupBy(searchLogs.wordId));
  const meaningStats = database.$with("quality_meanings").as(database.select({ wordId: meanings.wordId,
    meaningCount: sql<number>`count(*) filter (where ${meanings.meaning} ~ '[^[:space:]]')`.mapWith(Number).as("meaning_count"),
    withoutExamples: sql<number>`count(*) filter (where ${meanings.meaning} ~ '[^[:space:]]' and not exists (
      select 1 from ${examples} e where e.meaning_id = "meanings"."id" and e.sentence ~ '[^[:space:]]'
    ))`.mapWith(Number).as("without_examples"),
  }).from(meanings).groupBy(meanings.wordId));
  // Match the reader's latest-reviewed-recording precedence. A generated
  // association counts only while its headword still matches the current word.
  const reviewed = database.$with("quality_reviewed_audio").as(database.selectDistinctOn([pronunciations.wordId], {
    wordId: pronunciations.wordId,
    available: sql<boolean>`${pronunciations.audioUrl} ~ '[^[:space:]]'`.as("reviewed_available"),
  }).from(pronunciations).orderBy(asc(pronunciations.wordId), desc(pronunciations.id)));
  const generated = database.$with("quality_generated_audio").as(database.select({ wordId: wordPronunciationAudio.wordId,
    headword: wordPronunciationAudio.headword,
    available: sql<boolean>`${pronunciationAssets.audioUrl} ~ '[^[:space:]]'`.as("generated_available"),
  }).from(wordPronunciationAudio).innerJoin(pronunciationAssets, eq(wordPronunciationAudio.assetKey, pronunciationAssets.key)));
  const searches = sql<number>`coalesce(${demand.searches}, 0)`.mapWith(Number);
  const quality = database.$with("content_quality").as(database.select({
    id: words.id, name: words.name, variant: words.variant,
    searches: searches.as("search_count"),
    meaningCount: sql<number>`coalesce(${meaningStats.meaningCount}, 0)`.mapWith(Number).as("meaning_count"),
    withoutExamples: sql<number>`coalesce(${meaningStats.withoutExamples}, 0)`.mapWith(Number).as("without_examples"),
    meaning: sql<boolean>`coalesce(${meaningStats.meaningCount}, 0) = 0`.as("missing_meaning"),
    pronunciation: sql<boolean>`not coalesce(${reviewed.available}, ${generated.available}, false)`.as("missing_pronunciation"),
    examples: sql<boolean>`coalesce(${meaningStats.withoutExamples}, 0) > 0`.as("missing_examples"),
    source: sql<boolean>`${wordSources.id} is null`.as("missing_source"),
    etymology: sql<boolean>`not coalesce(${roots.root} ~ '[^[:space:]]', false)`.as("missing_etymology"),
  }).from(words)
    .leftJoin(demand, eq(demand.wordId, words.id)).leftJoin(meaningStats, eq(meaningStats.wordId, words.id))
    .leftJoin(reviewed, eq(reviewed.wordId, words.id))
    .leftJoin(generated, and(eq(generated.wordId, words.id), eq(generated.headword, words.name)))
    .leftJoin(wordSources, eq(wordSources.id, words.sourceId)).leftJoin(roots, eq(roots.id, words.rootId))
    .where(and(input.q ? ilike(words.name, `%${input.q.replace(/[\\%_]/g, "\\$&")}%`) : undefined,
      input.demand === "searched" ? sql`${searches} > 0` : input.demand === "unsearched" ? sql`${searches} = 0` : undefined)));
  const needsWork = sql<boolean>`${quality.meaning} or ${quality.pronunciation} or ${quality.examples} or ${quality.source}`;
  const matches = input.gap === "any" ? needsWork : eq(quality[input.gap], true);
  const tables = [demand, meaningStats, reviewed, generated, quality] as const;
  const filteredCount = (condition: SQLWrapper) => sql<number>`count(*) filter (where ${condition})`.mapWith(Number);
  const pageQuery = database.with(...tables).select().from(quality).where(matches)
    .orderBy(...(input.sort === "name" ? [] : [input.sort === "demand_asc" ? asc(quality.searches) : desc(quality.searches)]), asc(quality.name), asc(quality.id))
    .limit(input.pageSize);
  const [initialItems, metrics] = await Promise.all([
    pageQuery.offset((input.page - 1) * input.pageSize),
    database.with(...tables).select({ words: count(), needsWork: filteredCount(needsWork),
      meaning: filteredCount(quality.meaning), pronunciation: filteredCount(quality.pronunciation),
      examples: filteredCount(quality.examples), source: filteredCount(quality.source), etymology: filteredCount(quality.etymology),
      matching: filteredCount(matches), searches: sql<number>`coalesce(sum(${quality.searches}), 0)`.mapWith(Number),
    }).from(quality),
  ]);
  const summary = metrics[0]!;
  const page = Math.min(input.page, Math.max(1, Math.ceil(summary.matching / input.pageSize)));
  const items = summary.matching === 0 ? [] : page === input.page ? initialItems : await pageQuery.offset((page - 1) * input.pageSize);
  return { generatedAt, checkedAt: now, window, summary, items, total: summary.matching, page, pageSize: input.pageSize };
}
