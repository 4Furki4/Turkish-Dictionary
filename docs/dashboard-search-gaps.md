# Search gaps and spelling work

Step 4 extends the existing dashboard with `/dashboard/search-gaps` (English)
and `/panel/sonucsuz-aramalar` (Turkish). Both the page and tRPC procedures require
an administrator. Review state is shared across locales and search sources.

## Measurement contract

- Queries are grouped by the stored Stage 3 normalized term: NFC, Turkish casing,
  trimmed/collapsed spaces and straight apostrophes. Dotted and dotless Turkish
  letters remain distinct. Pattern submissions containing `_` are separately
  selectable; they cannot prefill word-creation or spelling forms.
- The selected Stage 2 UTC window is shared by counts, list timestamps and daily
  series. Its inclusive end date becomes an exclusive next-day boundary, capped
  at the response snapshot. The overview preview uses the overview snapshot.
- Query-bearing detail is further limited to the last 90 elapsed days at read
  time, even if scheduled retention is delayed. Older parts of a selection are
  explicitly identified. Unretained/pre-collection days are gaps in the chart,
  not measured zeros.
- The rate is `no_result / (resolved + no_result)` for the same retained window,
  source and search type. Operational errors have their own count. Cancelled and
  superseded attempts are excluded. No completed reports means an unmeasured
  rate, including when only errors were reported.
- Summary totals and the period trend cover all terms for the selected source
  and type. Term search and review-state filters apply only to the gap list;
  they do not silently change the rate's denominator.
- Frequency and first/last timestamps describe historical `no_result` reports
  in that selected retained interval, not lifetime demand. Term-level daily
  details list days with recorded misses.
- “First recorded activity” is the earliest observed UTC day in the anonymous
  daily totals. This survives raw-event expiry; it does not promise a complete
  collection history. Empty periods and interrupted collection cannot be
  distinguished from absent traffic solely from these reports. Bot filtering,
  blocked requests and connected-only local-dictionary reporting retain the
  limitations documented in [search-outcome-telemetry.md](search-outcome-telemetry.md).

## Rechecking and triage

Current live matches use the existing online dictionary's `ILIKE` predicate,
including its underscore pattern behavior. A bounded SQL probe per displayed
term runs in one list query, without logging reader searches or reusing cached
word results. Existing spelling corrections are shown separately: a correction
record is not a claim that every search source now resolves. Refresh checks
again; historical counts remain after a matching word is added.

Word/spelling links pass a validated term into the existing forms. Opening a
form creates nothing and bypasses no permissions. A correction link can select
an exact correction ID; missing/deleted corrections produce an empty result.
Resolved terms are not offered as new entries.

The administrator explicitly chooses a current decision:

- **Not reviewed:** no decision row; reopening deletes the current decision.
- **Reviewed** or **Dismissed:** a current triage state, with no linked target.
- **Linked:** a word, spelling correction or contribution request ID. The server
  checks that the target exists before saving. An available current word or
  correction pre-fills the target. Target IDs are retained if a target is later
  removed; unavailable words are identified rather than assigned a new identity.

`search_gap_reviews` stores only the normalized query, decision, optional target
type/ID, updating administrator ID and server timestamp. It contains no reader
identity, submitted freeform note, network identifier or external URL. Deleting
an administrator clears the actor foreign key but preserves the current decision.
This is not Stage 6's audit history: later saves replace the previous decision.

Query-bearing decisions become inactive after 90 days without an update. The
existing authenticated retention job deletes them with raw outcomes; a normal
daily cadence can leave physical records for almost 91 days, and job failures
can extend that. List reads already treat expired decisions as unreviewed.
Anonymous daily totals remain text-free and are not deleted by this operation.

## Bounds and rollout

URL state preserves range, term, source, search type, review state, frequency/
recency ordering and page. Range/filter changes reset pagination. API pages are
bounded to 5–25 items and page numbers to 1–1000. Ties use normalized query order.
An out-of-range page is clamped to the last available page, including when a
decision removes the final item on the current page.
Invalid URLs fall back with an explanation. Loading, initial failure, no reports,
no completed attempts, no matching gaps and cached-data refresh failures differ.

Migration `0053_search_gap_reviews` adds the current-decision table, checks, an
administrator foreign key and an update-time retention index. Existing receipt
and dictionary indexes support the initial read path; aggregation indexes should
be added only after measuring the relevant query plan.

Apply migration 0053 before deploying the page, procedures or updated retention
job. Follow the Pi migration runbook for an explicitly authorized environment
rollout; local build/browser evidence does not establish deployment or migration
on development or production.

## Local query-plan evidence

A transactionally rolled-back disposable fixture used 50,000 events across
1,000 terms, 100,000 dictionary entries, 500 spelling corrections and 250 review
decisions. Ten displayed rows came from 800 distinct gaps. Six bounded reads
completed in about 201 ms in the missing-match case, versus about 493 ms before
materializing dictionary candidates as the existing word lookup does.

`EXPLAIN (ANALYZE, BUFFERS)` showed the existing `name_idx` serving those probes;
the list plan fell from about 425 ms to 160 ms. Full-window aggregate plans were
about 9–32 ms, selecting almost the entire synthetic event table. No new event
aggregation index was justified by this fixture. These are local point
measurements, not production latency guarantees. All fixture rows were rolled
back and table statistics refreshed afterward.
