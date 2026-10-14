# Dashboard roadmap

Updated: 2026-10-15. Audience: dictionary administrators. Deliver one independently reviewable stage at a time.

## Outcomes

- Improve dictionary coverage using evidence of what readers search for and what entries lack.
- Make moderation faster by exposing waiting work and linking directly to the existing review tools.
- Explain usage and performance with comparable periods, explicit measurement coverage, and reliable timestamps.
- Make administrative changes attributable and inspectable.

## Existing baseline

The overview already provides word/user totals, resolved searches today and over seven days, pending request/open feedback counts, a 14-day search trend, authenticated/anonymous search proportions, popular words, and a separate 30-day average/p95 latency chart. The latency chart measures successful submitted searches through to the displayed result; it does not measure all visits or unsuccessful searches.

Content management, request review, feedback, spelling corrections, word relations, relation suggestions, daily words, and user management already have their own tools. Extend these tools instead of creating competing editing or approval flows.

Current `search_logs` require an existing `word_id`. They cannot establish the rate or frequency of searches for missing words. Existing request resolution metadata covers moderation decisions; it is not a general administrative audit trail.

## Delivery order

| Stage | Deliverable | Depends on | Schema work | Status |
| --- | --- | --- | --- | --- |
| 1 | Needs-attention overview and precise review links | Existing requests and feedback | None | Complete locally |
| 2 | Shared date ranges and previous-period comparisons | Existing analytics | None | Complete locally |
| 3 | Search-outcome collection | Defined search attempt/outcome contract | New event storage and retention | Planned |
| 4 | Search gaps and spelling opportunities | Stage 3, stage 2 filters | Aggregation indexes as justified | Planned |
| 5 | Content quality queue, ordered by demand | Existing content and search logs; stage 2 filters | None expected initially | Planned |
| 6 | Administrative history and change inspection | Inventory of administrative mutations | New audit storage | Planned |

Stages 1 and 2 provide immediate improvements. Stage 3 must collect data before stage 4 can tell us which gaps matter. Stage 5 can proceed while those events accumulate. Keep these as separate changes, each with its own validation evidence.

## Stage 1: Needs attention

**Goal:** An administrator can identify the oldest waiting work and open the correct review screen from the overview.

Scope:

- A separate admin-only `getNeedsAttention` procedure, so an attention-query failure does not replace the entire dashboard with an error.
- Pending requests and feedback with status `open`, each showing its total, number waiting at least seven full days, and five oldest items.
- Stable ordering by creation/request date, then ID. Seven days is a visibility threshold, not a promised service deadline.
- Request links use the existing localized request-detail route. Feedback links select the exact ID in the existing management page, even if its status has since changed.
- Age is computed against the server response timestamp; loading, empty, failure, cached-data/refresh-failure, and retry states are distinct.
- Turkish and English copy; mobile containment, visible keyboard focus, and the current translucent surfaces.

Implementation:

1. Add `src/server/dashboard-attention.ts` for bounded summaries and oldest-item queries; expose it through `src/server/api/routers/admin/overview.ts` using `adminProcedure`.
2. Add `src/_pages/dashboard/overview/needs-attention.tsx` and place it before the analytics charts in `dashboard-overview.tsx`.
3. Add an optional validated feedback ID to `src/server/api/routers/admin/feedback.ts`; use the URL parameter in `src/_pages/dashboard/feedback/feedback-list.tsx` with a visible way back to the full list.
4. Update both message files and add focused authorization/state/navigation coverage plus real desktop/mobile browser checks.

Acceptance:

- Given mixed pending/approved/rejected requests and open/closed/in-progress feedback, when an admin opens the overview, only pending requests and open feedback appear in the queues.
- Given equal timestamps and more than five waiting items, when the queues load, the five oldest appear in deterministic ID order and totals include all matching items.
- Given items just before, exactly at, and just after the seven-day threshold, when summaries load, only items at least seven full days old count as aging.
- Given no waiting work, when data loads, each queue shows an explanatory empty state rather than an error or fabricated items.
- Given a failed initial query or refresh, when the section renders, it offers retry and retains any last loaded data with a stale-data message.
- Given an anonymous or non-admin caller, when the procedure runs, access is denied before any database query.
- Given an item link in either locale, when followed, it opens that request or that exact feedback item; a resolved feedback item remains inspectable and a deleted one produces an empty result.
- Given desktop/mobile widths, long feedback titles, and either language, when rendered, links and headings wrap without page overflow.

## Stage 2: Comparable analytics

**Goal:** An administrator can distinguish real growth or regressions from a change in the measurement window.

Scope and implementation:

- Add a shared validated date-window helper under `src/server/` and schemas under `src/server/api/schemas/`; extend the overview and latency procedures rather than introducing another analytics service.
- Add 7/30/90-day presets and a custom date range in the overview, backed by URL state. Reload and Back restore the selected range.
- Use UTC consistently for event bucketing, range boundaries, and labels; show the timezone next to the range. Convert the selected inclusive end date to an exclusive next-day boundary.
- Compare completed periods of equal length. If the current day is included, label the period as partial and compare equal elapsed time.
- Apply the same window to trends, popular words, actor proportions, and latency. Keep all-time totals and current moderation queues explicitly separate from period metrics.
- Show absolute and percentage changes for searches, new accounts, submitted/resolved contributions, and latency, with denominator-aware handling of an empty prior period.
- Compute p95 from raw events across the selected window, never by averaging daily percentiles. Display sample counts and collection coverage.
- Stabilize the existing overview's implicit number/time formatting and chart sizing alongside this work. Stage 1 browser runs observed existing server-side chart-dimension warnings; the new attention section formats its snapshot explicitly in UTC.

Acceptance:

- Given a preset/custom range, when selected, all period-based sections use identical boundaries and the URL preserves the choice.
- Given invalid/reversed/overlong dates, when submitted, validation explains the problem without making an unbounded query.
- Given a zero previous-period denominator or a partial current day, when comparisons render, the dashboard shows an explicit new/no-baseline/partial state instead of an infinite or misleading percentage.
- Given UTC-boundary events and clients in different timezones, when the same URL loads, counts, buckets, and labels agree without hydration errors.
- Given slow or unavailable latency data, when the rest of the overview loads, other analytics remain usable.

Implemented contract:

- URL state: `range=7d`, `range=30d` (default), `range=90d`, or `range=custom&start=YYYY-MM-DD&end=YYYY-MM-DD`. Custom dates are inclusive, valid UTC calendar dates from 1970 onward, at most 90 days, and cannot extend into a future UTC date. Invalid URLs show an explanation and the default 30-day range; invalid form submissions preserve the last applied URL.
- `src/server/api/schemas/dashboard.ts` owns validation and URL parsing. `src/server/dashboard-window.ts` owns UTC boundaries and comparisons. `src/server/dashboard-overview.ts` owns overview reads.
- The current interval is `[start, min(next-day-after-end, snapshot time))`. The previous interval starts the nominal number of calendar days earlier and covers exactly the same elapsed duration. A partial current day never receives a full previous day as its comparison.
- Searches, new accounts, submitted requests, resolved requests, popular words, actor proportions, and daily counts use this window. Latency uses the overview's `generatedAt` as its validated `asOf` snapshot, with its own request/error boundary and raw-sample average/p95 calculations for both periods.
- All-time word/user totals and current moderation queues are explicitly labelled separately. Resolution counts require approved/rejected status and a recorded resolution timestamp. Empty measurements and zero prior activity produce explicit states rather than infinite percentages or fabricated zero latency.
- Chart containers use Recharts 3 native responsive sizing. Numbers use the route locale; dates, timestamps, and buckets explicitly use UTC. Existing charts and the attention queue remain independently usable.

## Stage 3: Search-outcome foundation

**Goal:** Measure submitted search attempts, including unsuccessful searches, without delaying results or changing the existing latency metric.

Scope and implementation:

- Inventory the main search box, navbar, online route, cached lookup, and offline paths using `src/hooks/useWordSearch.ts`, `src/lib/word-query-latency.ts`, and `src/server/search-logging.ts`.
- Define one attempt ID per actual submission. Distinguish resolved, no result, operational error, and superseded/cancelled attempts; autocomplete requests and direct page visits are not submitted attempts.
- Define Turkish-aware normalization, locale, source, result count/outcome, and server receipt timestamp. Keep raw text out of the existing duration-only latency endpoint.
- Add a dedicated schema/table and Zod-validated ingestion boundary under the existing search telemetry router. Retain the existing telemetry quota separation, deduplication, and fire-and-forget behavior.
- Before recording query text, define length limits, sanitization, access, a 90-day raw-event retention policy, and daily aggregates without account IDs, email addresses, or full URLs. Do not retain network identifiers as analytics dimensions.
- Treat browser events as reported activity rather than guaranteed human traffic. Document bot filtering and coverage limitations. Offline outcomes are reported only when connected unless a separately bounded offline queue is implemented.
- Generate and inspect Drizzle migrations; validate against a disposable/local database before any environment rollout.

Acceptance:

- Given one submission through each supported entry point, when it resolves or finds nothing, one outcome event is recorded with a stable attempt ID.
- Given refreshes, autocomplete calls, duplicate reports, cancellations, or direct visits, when collection runs, they do not inflate completed-attempt counts.
- Given malformed/oversized/identifying input or an exhausted quota, when reported, the endpoint rejects it without affecting dictionary search availability.
- Given unavailable telemetry storage, when a user searches, results still render and the existing latency metric keeps its defined meaning.
- Given events older than the retention window, when cleanup runs, raw query events expire while documented aggregates remain usable.

## Stage 4: Search gaps

**Goal:** Turn unsuccessful demand into specific dictionary work.

Scope and implementation:

- Add an admin search-gaps list and an overview preview. Update both i18n route maps if adding a page.
- Group normalized unsuccessful queries; show frequency, first/last seen, selected-period trend, and explicit collection start date.
- Show a no-result rate only against recorded completed attempts from the same source/window; distinguish operational errors from missing content.
- Support query search, frequency/recency sorting, date filters, bounded pagination, and URL-backed state.
- Link a gap to the existing word-creation, misspelling-correction, or contribution workflow. Record reviewed/dismissed/linked resolutions without automatically adding dictionary entries.
- Recheck whether a query now resolves; historic failures are evidence of prior outcomes, not proof that the word is still missing.

Acceptance:

- Given differently cased Turkish variants, when grouped, the documented normalization combines equivalent queries without conflating distinct words.
- Given a missing word that is later added, when reviewed, the list identifies its current resolution while retaining correctly labelled historical counts.
- Given a spelling issue or genuine coverage gap, when an admin acts, the existing workflow receives the intended term and requires its existing review permissions.
- Given a fresh installation or collection outage, when the dashboard loads, it distinguishes no data from a measured zero failure rate.

## Stage 5: Content quality

**Goal:** Find incomplete entries and improve the ones readers encounter most.

Scope and implementation:

- Begin with deterministic checks: no meanings, no playable pronunciation, meanings without examples, and no source attribution. Treat missing optional etymology as an enrichment opportunity, not an invalid entry.
- Reuse `db/schema/words.ts`, meanings/examples/pronunciations, and source relations. Inventory pronunciation status rules before deciding that an asset is playable.
- Add filters by gap type, query, popularity, and date window with stable pagination. Prioritize recent search demand, then deterministic word/name ordering.
- Return aggregate counts plus a bounded preview on the overview; keep detailed editing in existing word/contribution screens.
- Use query plans and realistic data to avoid N+1 queries or expensive per-row counts. Add indexes only with evidence.

Acceptance:

- Given entries with present/missing/failed pronunciation assets and optional enrichment fields, when classified, each appears only in the documented applicable categories.
- Given popular and rarely viewed incomplete entries, when demand sorting is selected, recent search frequency determines priority without excluding entries with zero searches.
- Given a corrected entry, when the list refreshes, the resolved gap disappears without requiring a manual quality flag.
- Given multiple missing fields, when totals are shown, overlapping categories are labelled so they are not mistaken for distinct-word totals.

## Stage 6: Administrative history

**Goal:** An administrator can determine who changed content or settings and inspect the change.

Scope and implementation:

- First inventory mutations for word/content edits, request decisions, feedback state/type changes, role changes, announcements, and dynamic parameters. Publish a coverage checklist before calling the history complete.
- Define a shared server audit writer with actor, action, target type/ID, server timestamp, optional originating request ID, and a bounded allowlisted before/after diff.
- Exclude secrets, credentials, session material, and unrestricted submitted payloads. Record only fields needed to understand each supported change.
- Write the audit event atomically with the mutation where they share the database transaction. Define explicit failure behavior; do not silently claim an unaudited action was recorded.
- Add an admin-only history page with actor/entity/action/date filters, stable pagination, and detail inspection. Reuse request `resolvedAt`/`resolvedBy` as linked historical context, not invented pre-existing audit events.
- Preserve attributable history when a target is deleted. Define actor-deletion behavior and retention before choosing foreign-key/delete rules.
- Reverting a change is a separate, permission-checked mutation with its own audit event; automatic undo is outside this stage.

Acceptance:

- Given each supported mutation succeeds, when its transaction commits, exactly one attributable event exists with the permitted diff.
- Given a mutation rolls back, when inspected, no successful-change audit event exists.
- Given a deleted target or actor, when history is opened, the event remains understandable under the documented deletion policy.
- Given a non-admin user, when history is requested, access is denied server-side.
- Given pre-collection changes, when browsing history, the UI clearly states its start date rather than implying full historic coverage.

## Validation and rollout

- For every stage: focused logic/permission tests, `bun run test`, `bun run build`, and desktop/mobile checks in Turkish and English for the affected UI. Check keyboard operation, loading/error/empty states, and long labels/titles.
- Use the existing disposable CI database and browser setup for fixtures. Keep developer and production data out of test setup.
- Record actual validation results here at each stage; a locally passing build is not evidence of deployment.
- Database changes follow the migration runbook. Verify the target ledger, inspect generated SQL, back up where required, and verify health after application. Production migration/deployment remains a separate explicitly authorized operation.
- Keep later stages planned until implemented and validated; do not build all six in one change.

## Progress log

- 2026-10-15: Roadmap written from the current checkout. Stage 1 implementation started.
- 2026-10-15: Stage 1 completed locally. The overview shows bounded oldest-first queues, full totals, seven-day aging counts, response-snapshot ages, independent loading/retry/refresh-error states, and localized review links. Feedback ID links survive resolution, support Back/reload, and handle deletion as an empty result. Returning to the overview rechecks the queue even within its normal one-minute freshness window.
- Validation: production `bun run build` passed via `bun run ci:build` with the isolated CI environment; the full Jest suite passed (88 suites, 467 tests; 1 suite/15 tests intentionally skipped). Changed-file ESLint and TypeScript checks passed. Four Playwright cases passed against the production build (Turkish/English, desktop/mobile), including real SQL filtering/order/counts, the exact seven-day boundary, keyboard links, long titles, and targeted feedback after resolution/deletion. Desktop and mobile screenshots were inspected. The mechanical UI detector returned no findings.
- Environment notes: installed dependencies with the frozen Bun lockfile and downloaded Playwright Chromium into temporary storage. Chromium required a browser-test run outside the filesystem sandbox to launch on macOS. Only the fixed disposable CI database was used for fixtures; those fixtures were removed by the tests.
- Stage 1 follow-up: shared date ranges/comparisons and the existing chart sizing warnings were scheduled for Stage 2.
- 2026-10-15: Stage 2 completed locally. Added URL-backed 7/30/90-day presets and validated custom dates, equal-duration previous-period comparisons, selected-period contribution/account/search metrics, matching latency comparisons, UTC/locale-safe formatting, and native responsive charts. Back/reload restore the applied range. No schema migration was needed.
- Stage 2 validation: production `bun run build` passed through the isolated CI build command; full Jest suite passed (89 suites, 492 tests; 1 suite/15 existing tests skipped); changed-file ESLint and TypeScript checks passed. Twelve browser cases passed on the final build across both languages and desktop/mobile, including the Stage 1 queue and submitted-search latency regressions. New analytics cases used a Los Angeles browser timezone and an Auckland database session to verify UTC buckets, exact date endpoints, raw p95, partial-period exclusions, validation, empty baselines, mobile touch input, URL history, control heights, and page containment. Browser errors and chart-size warnings were absent. Desktop/mobile screenshots were inspected; the mechanical detector reported no findings. Disposable fixtures were cleaned up.
- Next: Stage 3, search-outcome collection, before building the search-gaps views.
