# Word query latency

The dashboard shows daily average and 95th percentile search latency over the last
30 UTC days, plus aggregates for the whole window. A daily table includes sample
counts. Days with no samples are gaps, rather than zero milliseconds.

## Measurement

Timing starts when a user submits a word through the main search box (including
selecting a recommendation) or navbar. It finishes at the matching headword paint when the browser supports the
[Element Timing API](https://w3c.github.io/element-timing/). Buffered paint entries
include server-rendered results shown before hydration. Otherwise, two animation
frames after the client commit estimate the paint boundary; this fallback can
include hydration time on a full navigation and is not an exact display timestamp. It includes
offline-cache priming, navigation, network and server time. Cached results count.
Typing time and completion of decorative animations do not count.

Only successful exact-word searches are measured. Pattern searches, direct visits,
missing results, background refreshes, superseded searches, background-tab waits
and durations over two minutes are excluded. Disconnected results cannot report;
there is no delayed offline queue. This is a sample of connected JavaScript search
sessions, not every server query. Searches submitted without JavaScript are not
measured.

A single pending marker in sessionStorage survives full navbar navigations. It
contains the requested word locally to match the result, then is removed before
reporting. Full-document navigation markers also identify the source document;
only a destination document can finish them, even when the requested word is
already displayed. The report contains only a random event ID, integer milliseconds and
online/offline result source. Storage or reporting failure cannot block search.

## Storage and rollout

`word_query_latencies` stores anonymous samples with a server receive timestamp.
A UUID primary key prevents duplicate reports; input and database constraints bound
the duration and source. The admin query computes its overall percentile from raw
samples, not daily percentiles. Both SQL buckets and window boundaries use UTC.
Telemetry uses its own tRPC namespace so reports do not invalidate word caches.

Apply generated migration `0051_black_patch.sql` before deploying collection. Follow
`docs/raspberry-pi-database-migrations.md` for Pi ledger inspection, development-first
application, production backup and authorization. This feature does not apply Pi
migrations automatically. The latency query is independent of the existing overview;
an unavailable timing table shows a retry state while other dashboard metrics work.
The graph refreshes every minute while the dashboard is visible.

Samples begin with deployment; historical latency cannot be reconstructed from old
search logs. No retention job is added by this feature.
