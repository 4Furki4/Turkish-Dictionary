import { expect, type Page, type Request } from "@playwright/test";
import type postgres from "postgres";
import type { SearchOutcomeInput } from "../../src/lib/search-outcome-schema";
const acceptedByIds = new WeakMap<Set<string>, Set<string>>();

function eventsFromRequest(request: Pick<Request, "postDataJSON">, property: string): { eventId: string }[] {
  const input: Record<string, { json: unknown }> = request.postDataJSON();
  return Object.values(input).map(value => value.json).filter(value => value && typeof value === "object" && property in value) as { eventId: string }[];
}
export const outcomeFromRequest = (request: Pick<Request, "postDataJSON">) => eventsFromRequest(request, "query")[0] as SearchOutcomeInput | undefined;

function observeReports(page: Page, procedure: string, property: string) {
  const ids = new Set<string>();
  const accepted = new Set<string>();
  acceptedByIds.set(ids, accepted);
  page.on("request", request => {
    if (request.url().includes(procedure) && request.method() === "POST") {
      eventsFromRequest(request, property).forEach(event => ids.add(event.eventId));
    }
  });
  page.on("response", response => {
    if (response.url().includes(procedure) && response.status() === 200 && response.request().method() === "POST") {
      eventsFromRequest(response.request(), property).forEach(event => accepted.add(event.eventId));
    }
  });
  return ids;
}
export const observeSearchOutcomeEvents = (page: Page) => observeReports(page, "searchTelemetry.recordSearchOutcome", "query");
export const observeWordQueryLatencyEvents = (page: Page) => observeReports(page, "searchTelemetry.recordWordQueryLatency", "durationMs");

async function waitForWrites(database: ReturnType<typeof postgres>, ids: Set<string>, table: "search_outcomes" | "word_query_latencies") {
  // Streaming batch headers can arrive before every mutation commits. Check
  // the database rather than waiting for a stream a page navigation may cancel.
  const accepted = [...(acceptedByIds.get(ids) ?? [])];
  if (accepted.length) await expect.poll(async () => {
    const [row] = await database`SELECT count(*)::integer AS n FROM ${database(table)} WHERE event_id IN ${database(accepted)}`;
    return row!.n;
  }, { timeout: 5000 }).toBe(accepted.length);
}

export async function cleanupWordQueryLatencyEvents(database: ReturnType<typeof postgres>, ids: Set<string>) {
  if (!ids.size) return;
  await waitForWrites(database, ids, "word_query_latencies");
  await database`DELETE FROM word_query_latencies WHERE event_id IN ${database([...ids])}`;
}

export async function cleanupSearchOutcomeEvents(database: ReturnType<typeof postgres>, ids: Set<string>) {
  if (!ids.size) return;
  await waitForWrites(database, ids, "search_outcomes");
  // Preserve other tests' concurrent increments in these shared UTC buckets.
  await database.begin(async tx => {
    const groups = await tx`WITH deleted AS (DELETE FROM search_outcomes WHERE event_id IN ${tx([...ids])} RETURNING *)
      SELECT to_char(received_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS day, locale, entry_point, source, kind, outcome, count(*)::integer AS n
      FROM deleted GROUP BY day, locale, entry_point, source, kind, outcome`;
    for (const group of groups) {
      await tx`DELETE FROM search_outcome_daily_totals WHERE day = ${group.day} AND locale = ${group.locale} AND entry_point = ${group.entry_point}
        AND source = ${group.source} AND kind = ${group.kind} AND outcome = ${group.outcome} AND count = ${group.n}`;
      await tx`UPDATE search_outcome_daily_totals SET count = count - ${group.n} WHERE day = ${group.day} AND locale = ${group.locale} AND entry_point = ${group.entry_point}
        AND source = ${group.source} AND kind = ${group.kind} AND outcome = ${group.outcome} AND count > ${group.n}`;
    }
  });
}
