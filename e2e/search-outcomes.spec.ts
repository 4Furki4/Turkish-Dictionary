import { randomUUID } from "node:crypto";
import { expect, test, type Page, type Response } from "@playwright/test";
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { ciEnvironment } from "../scripts/ci/env.mjs";
import { recordSearchOutcome, pruneSearchOutcomes } from "../src/server/search-outcomes";
import type { SearchOutcomeInput } from "../src/lib/search-outcome-schema";
import { DB_NAME, DB_VERSION, METADATA_STORE, OFFLINE_METADATA_KEY, WORDS_STORE } from "../src/lib/db-config";
import tr from "../messages/tr.json";
import en from "../messages/en.json";
import { cleanupSearchOutcomeEvents, cleanupWordQueryLatencyEvents, observeSearchOutcomeEvents, observeWordQueryLatencyEvents, outcomeFromRequest } from "./helpers/search-outcomes";

function reportFrom(response: Response | { request(): { postDataJSON(): Record<string, { json: unknown }> } }): SearchOutcomeInput {
  const event = outcomeFromRequest(response.request());
  if (!event) throw new Error("The request contained no search outcome");
  return event;
}
const waitForOutcome = (page: Page) => page.waitForResponse(response => response.url().includes("searchTelemetry.recordSearchOutcome") && response.request().method() === "POST");
const rpcBody = (event: SearchOutcomeInput) => ({ "0": { json: event } });

for (const locale of ["tr", "en"] as const) {
  test(`${locale}: submissions record one outcome without affecting search`, async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    const sql = postgres(ciEnvironment().DATABASE_URL, { max: 1 });
    const ids = observeSearchOutcomeEvents(page);
    const latencyIds = observeWordQueryLatencyEvents(page);
    const errors: string[] = [];
    const copy = locale === "tr" ? tr : en;
    const search = locale === "tr" ? "arama" : "search";
    const missing = "bulunamayan" + randomUUID().replace(/[^a-z]/g, "");
    const input = () => page.getByRole("searchbox", { name: copy.Home.hero.searchPlaceholder, exact: true }).first();
    page.on("pageerror", error => errors.push(error.message));
    await page.route(/^https:\/\//, route => route.abort());
    await page.context().setExtraHTTPHeaders({ "x-forwarded-for": `10.43.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}` });
    await page.emulateMedia({ reducedMotion: "reduce" });
    try {
      await page.goto(`/${locale}`);
      await input().fill("kitap");
      const resolvedResponse = waitForOutcome(page);
      await input().press("Enter");
      await expect(page.getByRole("heading", { name: "kitap", exact: true })).toBeVisible();
      const resolved = await resolvedResponse;
      expect(resolved.ok()).toBe(true);
      const event = reportFrom(resolved);
      expect(event).toMatchObject({ query: "kitap", locale, entryPoint: "search", source: "online", outcome: "resolved", resultCount: 1 });
      expect(Object.keys(event).sort()).toEqual(["entryPoint", "eventId", "locale", "outcome", "query", "resultCount", "source"]);
      // Streaming tRPC headers can arrive before the mutation commits.
      await expect.poll(async () => {
        const [stored] = await sql`SELECT query, kind, outcome, result_count FROM search_outcomes WHERE event_id = ${event.eventId}`;
        return stored;
      }).toEqual({ query: "kitap", kind: "word", outcome: "resolved", result_count: 1 });

      const beforeRefresh = ids.size;
      await page.reload();
      await expect(page.getByRole("heading", { name: "kitap", exact: true })).toBeVisible();
      await page.waitForLoadState("networkidle");
      expect(ids.size).toBe(beforeRefresh);
      await page.goto(`/${locale}/${search}/kitap`);
      await page.waitForLoadState("networkidle");
      expect(ids.size).toBe(beforeRefresh);

      // API retries with the same ID cannot increment its persisted total twice.
      const duplicate = await page.request.post("/api/trpc/searchTelemetry.recordSearchOutcome?batch=1", { data: rpcBody(event) });
      expect(duplicate.ok()).toBe(true);
      const [deduplicated] = await sql`SELECT count(*)::integer AS count FROM search_outcomes WHERE event_id = ${event.eventId}`;
      expect(deduplicated.count).toBe(1);

      await page.goto(`/${locale}`);
      await input().fill(missing);
      const missResponse = waitForOutcome(page);
      await input().press("Enter");
      const miss = await missResponse;
      expect(miss.ok()).toBe(true);
      expect(reportFrom(miss)).toMatchObject({ query: missing, outcome: "no_result", resultCount: 0, source: "online" });
      await page.screenshot({ path: testInfo.outputPath("no-result.png") });

      if (testInfo.project.name === "desktop") {
        await page.goto(`/${locale}/dashboard-check`);
        const navbarInput = page.locator('form input[name="word"]').first();
        await navbarInput.fill("kitap");
        const navbarResponse = waitForOutcome(page);
        await navbarInput.press("Enter");
        const navbar = await navbarResponse;
        expect(navbar.ok()).toBe(true);
        expect(reportFrom(navbar)).toMatchObject({ query: "kitap", entryPoint: "navbar", outcome: "resolved" });
      }

      // A failed transport must not become a missing-content observation.
      await page.goto(`/${locale}`);
      await page.route(/\/api\/trpc\/.*word\.getWord(?:\?|,|$)/, route => route.abort("failed"));
      const failure = waitForOutcome(page);
      await input().fill(missing + "hata");
      await input().press("Enter");
      expect(reportFrom(await failure)).toMatchObject({ outcome: "error", resultCount: 0, source: "online" });
      await page.unroute(/\/api\/trpc\/.*word\.getWord(?:\?|,|$)/);

      // Install one valid local word in this isolated browser context; connected
      // pattern searches then exercise the real IndexedDB result path.
      await page.goto(`/${locale}`);
      const lookup = await page.request.get("/api/trpc/word.getWord", { params: { input: JSON.stringify({ json: { name: "kitap", skipLogging: true } }) } });
      expect(lookup.ok()).toBe(true);
      const word = (await lookup.json()).result.data.json[0].word_data;
      await page.evaluate(async ({ word, DB_NAME, DB_VERSION, METADATA_STORE, OFFLINE_METADATA_KEY, WORDS_STORE }) => {
        const database = await new Promise<IDBDatabase>((resolve, reject) => {
          const request = indexedDB.open(DB_NAME, DB_VERSION);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        await new Promise<void>((resolve, reject) => {
          const tx = database.transaction([METADATA_STORE, WORDS_STORE], "readwrite");
          tx.objectStore(METADATA_STORE).put({ schemaVersion: 1, activeVersion: 1, status: "ready", installedWordCount: 1, installedAt: Date.now() }, OFFLINE_METADATA_KEY);
          tx.objectStore(WORDS_STORE).put({ id: `1:${word.word_id}`, datasetVersion: 1, datasetLookupKey: "1\u0000kitap",
            datasetSortKey: "1\u0000kitap\u0000" + String(word.word_id).padStart(10, "0"), lookupKey: "kitap", wordId: word.word_id, wordName: "kitap", word });
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        database.close();
      }, { word, DB_NAME, DB_VERSION, METADATA_STORE, OFFLINE_METADATA_KEY, WORDS_STORE });
      await input().fill("k_tap");
      const patternResponse = waitForOutcome(page);
      await input().press("Enter");
      await expect(page.getByRole("heading", { name: "kitap", exact: true })).toBeVisible();
      const pattern = await patternResponse;
      expect(pattern.ok()).toBe(true);
      expect(reportFrom(pattern)).toMatchObject({ query: "k_tap", outcome: "resolved", source: "offline", resultCount: 1 });

      // Dropped telemetry does not delay or replace the dictionary result.
      await page.goto(`/${locale}`);
      await page.route(/\/api\/trpc\/.*searchTelemetry\.recordSearchOutcome/, route => route.fulfill({ status: 503, body: "Unavailable" }));
      const unavailable = waitForOutcome(page);
      await input().fill("kitap");
      await input().press("Enter");
      await expect(page.getByRole("heading", { name: "kitap", exact: true })).toBeVisible();
      expect((await unavailable).status()).toBe(503);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: testInfo.outputPath("search-still-works.png") });
      expect(errors).toEqual([]);
    } finally {
      try { await cleanupSearchOutcomeEvents(sql, ids); }
      finally {
        try { await cleanupWordQueryLatencyEvents(sql, latencyIds); }
        finally { await sql.end({ timeout: 5 }); }
      }
    }
  });
}

test("storage deduplicates concurrent reports atomically and retains totals after expiry", async () => {
  const sql = postgres(ciEnvironment().DATABASE_URL, { max: 5 });
  const db = drizzle(sql);
  const ids = Array.from({ length: 5 }, () => randomUUID());
  const day = "2003-02-03";
  const base = { eventId: ids[0]!, query: "kitap", locale: "en" as const, entryPoint: "navbar" as const, source: "offline" as const, outcome: "resolved" as const, resultCount: 1 };
  const cutoff = new Date(`${day}T12:00:00Z`);
  // This historical bucket is only used by this test, serialized across projects.
  const lock = postgres(ciEnvironment().DATABASE_URL, { max: 1 });
  await lock`SELECT pg_advisory_lock(20261015, 3)`;
  try {
    const [prior] = await sql`SELECT count(*)::integer AS n FROM search_outcome_daily_totals WHERE day = ${day}`;
    expect(prior.n).toBe(0);
    await Promise.all(Array.from({ length: 8 }, () => recordSearchOutcome(db as never, base, new Date(cutoff.getTime() - 1))));
    await recordSearchOutcome(db as never, { ...base, eventId: ids[1]! }, cutoff);
    await recordSearchOutcome(db as never, { ...base, eventId: ids[2]! }, new Date(cutoff.getTime() + 1));
    const [aggregate] = await sql`SELECT count FROM search_outcome_daily_totals WHERE day = ${day} AND outcome = 'resolved'`;
    expect(Number(aggregate.count)).toBe(3);
    const [raw] = await sql`SELECT count(*)::integer AS n FROM search_outcomes WHERE event_id IN ${sql(ids)}`;
    expect(raw.n).toBe(3);
    const result = await pruneSearchOutcomes(db as never, new Date(cutoff.getTime() + 90 * 86_400_000));
    expect(result.deleted).toBe(1);
    const remaining = await sql`SELECT event_id FROM search_outcomes WHERE event_id IN ${sql(ids)}`;
    expect(remaining.map(row => row.event_id).sort()).toEqual([ids[1], ids[2]].sort());
    const [retained] = await sql`SELECT count FROM search_outcome_daily_totals WHERE day = ${day} AND outcome = 'resolved'`;
    expect(Number(retained.count)).toBe(3);

    // Force the aggregate write to overflow; the inserted raw event must roll back.
    await sql`INSERT INTO search_outcome_daily_totals (day, locale, entry_point, source, kind, outcome, count)
      VALUES (${day}, 'en', 'navbar', 'offline', 'word', 'error', 9223372036854775807)`;
    await expect(recordSearchOutcome(db as never, { ...base, eventId: ids[3]!, outcome: "error", resultCount: 0 }, cutoff)).rejects.toThrow();
    const [rolledBack] = await sql`SELECT count(*)::integer AS n FROM search_outcomes WHERE event_id = ${ids[3]!}`;
    expect(rolledBack.n).toBe(0);
    await expect(sql`INSERT INTO search_outcomes (event_id, query, locale, entry_point, source, kind, outcome, result_count)
      VALUES (${ids[4]!}, 'kitap', 'en', 'navbar', 'offline', 'word', 'no_result', 1)`).rejects.toMatchObject({ code: "23514" });
  } finally {
    await sql`DELETE FROM search_outcomes WHERE event_id IN ${sql(ids)}`;
    await sql`DELETE FROM search_outcome_daily_totals WHERE day = ${day} AND locale = 'en' AND entry_point = 'navbar' AND source = 'offline' AND kind = 'word'`;
    await lock`SELECT pg_advisory_unlock(20261015, 3)`;
    await lock.end({ timeout: 5 });
    await sql.end({ timeout: 5 });
  }
});
