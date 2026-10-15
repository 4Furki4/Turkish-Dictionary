# Content quality queue

Stage 5 adds an admin-only current-content queue and independent overview preview.
English: `/dashboard/content-quality`. Turkish: `/panel/icerik-kalitesi`.

## Checks and measurement

- **No meaning:** no meaning with nonblank text. Blank legacy rows do not count.
- **No published audio:** no nonblank URL in the reader's selected recording.
  The latest community recording takes precedence; these rows enter through the
  existing moderation workflow. Otherwise a generated asset must have a current
  `word_pronunciation_audio` headword association and a nonblank URL. Unpublished,
  failed-generation and stale-headword assets do not supply audio. Generation
  review status lives in the publishing workspace, not an invented database flag.
  This is a metadata availability check: remote file/playback failures are not
  persisted, and the queue does not issue media probes or certify URL health.
- **Meanings without examples:** at least one nonblank meaning has no nonblank
  example sentence. A word without meanings is classified separately; blank
  example rows do not satisfy this check. The row gives the number of affected
  meanings, so one example cannot hide another incomplete meaning.
- **No source attribution:** no existing `word_sources` association. Any supported
  source type counts; attribution accuracy is not inferred automatically.
- **Optional etymology:** no linked root with nonblank text. This is a separate
  enrichment view and count; it does not make an otherwise complete entry a
  member of the default required-work queue.

Category totals overlap. “Needs work” counts each distinct word once across the
first four checks. Summary counts include the term and demand filters, regardless
of the selected gap category; the result count includes that category too.

The shared UTC date range scopes only recorded `search_logs` demand. Quality is
checked against current content, not reconstructed as of the selected period.
Demand counts existing-word lookups, including browsing; it is not the Stage 4
submitted-attempt denominator. Missing reports cannot establish absent reader
interest. All entries, including zero-recorded-demand entries, remain eligible.
No user identities or query-bearing outcome records are returned.

## Navigation and updates

URL state preserves range, term, gap, recorded-demand filter, sort, page and page
size. Term matching treats `%` and `_` literally. Filter/range changes reset the
page; equal-demand rows sort by name then ID. An out-of-range page clamps to the
last valid page. APIs allow 5–25 rows and page numbers 1–1000.

Rows link to the existing localized word list with the term prefilled and to the
reader's entry/contribution tools. The existing list lets administrators choose
the intended variant before editing. Opening links creates or edits nothing.
Returning to the queue or refreshing recomputes flags; there are no manual
quality flags to clear. Refresh failures retain the last data with a stale-data
message. Initial failure, loading and a measured empty result remain distinct.

Two bounded SQL reads aggregate demand, meaning/example counts and published
audio, then join them to words. No per-row API/database request is made. No schema
migration is initially required; query plans must justify any additional index.

## Local query-plan evidence

A transactionally rolled-back fixture used 100,000 entries and meanings,
approximately 66,667 examples, 200,000 lookups, 10,000 reviewed recordings and
20,000 generated associations. The two-read helper returned ten rows in about
632 ms. Separate `EXPLAIN (ANALYZE, BUFFERS)` runs measured about 121 ms for the
list and 531 ms for the summary. Existing primary and meaning indexes served
the joins; broad aggregations also used sequential/hash plans. No new index was
justified by this local fixture. These point measurements are not production
latency guarantees. Fixture rows were rolled back and table statistics restored
before browser checks.

## Direction contract

**THESIS:** Prioritize specific missing content using observed demand; keep the
editing decision in the established word tools.

**OWN-WORLD:** Preserve the dashboard's serif heading, sans controls, red primary,
neutral borders and `bg-background/40` surfaces. This is an ordinary extension.

**STORY:** Understand the checks and overlapping totals, select a gap, compare
recorded demand, then open the matching existing editor.

**FIRST VIEWPORT:** Title and refresh, current-quality counts, a compact filters/
dates disclosure with the applied UTC range, and the first ranked entry. Expand
the controls to change the selection or inspect measurement details.

**FORM:** A responsive operational list with readable row details and explicit
links; controls share 40px visible edges, with Turkish and English labels.

**QUALITY BAR:** Clear distinction between current quality and historical demand,
optional enrichment and required work, and published metadata and playback health.
