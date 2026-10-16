# Administrative history

Stage 6 records supported administrative mutations after deployment of migration
`0054_admin_audit_history`. It does not reconstruct earlier activity.

## Coverage inventory

The server registry is `src/server/admin-audit-registry.ts`. Each registered
procedure produces one event after a successful resolver, inside the same
PostgreSQL transaction. The root-router coverage test checks every mutation
marked administrative against the registry and explicit exclusions.

| Area | Covered actions | Retained fields |
| --- | --- | --- |
| Word editor | Add, edit, delete | Headword/variant, phonetic/prefix/suffix, source/root references, bounded meanings/examples/word attributes/etymology |
| Parameters | Create, update, delete word/meaning attributes, authors, parts of speech, languages and roots; legacy quick-create controls | Their public content fields and reference IDs |
| Request moderation | Approve, reject | Request ID, entity/action, status and resolver/time; existing request details remain the source for the submitted change |
| Feedback | Status/type changes, deletion | Feedback ID, status and type; no description, title or submitter identity |
| Accounts | Role changes and administrator deletion | Account ID and role; no email, credential, session or profile payload |
| Announcements | Create, update, delete | Slug/status/publication date, action-text key and bounded public translations; no media/action URLs |
| Content scheduling/corrections | Daily words, misspellings and galatimeshur create/update/delete | Their public content fields and word references |
| Relationships | Manual word/phrase relation create/update/delete; suggestion accept/dismiss/restore | Pair/type or suggestion status/reviewer/time and word IDs; no model evidence payload |
| Badges | Create/update/delete and assign/revoke | Badge definition or account/badge IDs and award time |
| Foreign-term suggestions | Approve/reject | Decision, resolver/time and created-word ID; no unrestricted suggestion/reason payload |

Explicit exclusions:

- Search-gap triage remains a query-bearing current decision under its separate
  90-day policy. It is not copied into this longer-lived history.
- Account self-service, ordinary user contributions/votes, Better Auth endpoints,
  scheduled jobs, direct SQL, imports, pronunciation publishing scripts and
  external administration are not instrumented administrative tRPC mutations.
- Request approval records the decision and existing request reference. It does
  not claim a complete before/after snapshot of every contribution handler's
  applied content. Cascading deletion and automatic point/badge side effects
  likewise do not create separate per-row audit events.

## Atomicity and failure behavior

After the existing server permission check, the administrative middleware wraps
each covered mutation in a transaction and passes that transaction as `ctx.db`.
Existing nested transactions become savepoints. Snapshot reads lock an existing
target row before the resolver runs. Covered dynamic-parameter writes use this
context rather than the global connection. Request-handler asynchronous loops
are awaited, and a resolved request cannot be approved or rejected again.

The writer selects allowlisted database columns, never serializes the raw input
or session, and computes a bounded before/after field diff. Mutation validation,
resolver, snapshot or audit-storage failure rolls back the whole transaction.
tRPC error results are rethrown to prevent a failed resolver from committing.
An explicit unsuccessful resolver result is not recorded as success. A successful
no-op may have an empty diff; the detail view explains this rather than inventing
changed fields. A missing target is not a successful audited change.

This is application history, not a tamper-proof database ledger: database
operators retain their existing ability to modify storage.

## Size, attribution and retention

Text values retain at most 512 UTF-16 code units without splitting surrogate pairs, arrays at most 40 items and
objects at most four nested levels. Snapshots read at most 41 related rows per
section to detect truncation. The final event keeps at most 40 changed fields
within a 40 KB UTF-8 budget; the database independently checks a 48 KB serialized
JSON ceiling. Truncated events are visibly labelled and cannot support full
reconstruction or undo. Long compound target IDs use a SHA-256 fingerprint.

Actor IDs and the display label at action time are retained with the event for
365 days, including after account deletion. Target IDs/labels and the optional
originating request ID also have no deletion foreign key. This preserves
attribution when an existing target or actor disappears. Only administrators
can read list/detail data; the list excludes the diff payload.

The collection-start singleton is initialized atomically with the first audited
action and survives event retention. The UI labels this as the first recorded
action, not deployment time or proof of coverage before that action. Before it
exists, the UI explicitly says that recording has not started. Earlier changes
are never backfilled from request resolution timestamps.

Reads exclude events older than 365 days even if pruning is late. The existing
authenticated daily view-count job deletes expired audit events. A prune failure
fails the job visibly; it does not expand the read retention window.

## Navigation and inspection

English: `/dashboard/history`. Turkish: `/panel/islem-gecmisi`.

The existing UTC range selector scopes occurrence time; custom historical windows
remain limited to 90 days per query. Actor ID, entity type/ID, action, page and page
size are URL-backed. Pagination orders by occurrence time then event ID, both
descending, and preserves a server-response snapshot cutoff. Refresh starts a new
snapshot. Events with a later recorded timestamp are excluded on subsequent
pages; late commits and retention can still change the returned rows.
Invalid URLs, initial loading/failure,
refresh failure with cached data, no recorded history and no matching events
remain distinct. Detail inspection uses its own admin-only read and handles a
pruned or unavailable event explicitly. Existing word/request links are
navigation only and do not restore or mutate deleted targets.

## Direction contract

**THESIS:** Find an attributable administrative action and inspect its bounded
change without implying a complete historical archive.

**OWN-WORLD:** Preserve the established red primary, serif page heading, sans
controls, neutral borders and `bg-background/40` surfaces. Ordinary extension.

**STORY:** Understand recording coverage, narrow by actor/entity/action/time,
inspect one event, then open the existing referenced content when useful.

**FIRST VIEWPORT:** Title/refresh, compact recording/retention explanation,
disclosed filters and the first event with actor, action, target and UTC time.

**FORM:** Responsive chronological list, inline details and aligned 40px filter
controls. Long labels and structured values wrap in both Turkish and English.

**QUALITY BAR:** Explicit coverage, retention and truncation; readable attribution,
stable ordering and distinct empty/error states. No automatic undo.

## Local validation and rollout

Validated on 2026-10-16 with the production build, 645 passing unit tests,
58 integrated browser cases and two additional content-integrity cases after
the final Unicode boundary fix. Browser checks cover Turkish and English at
desktop and mobile widths, real sessions/SQL writes, transaction rollback,
retention, deletion attribution, filters, pagination, keyboard navigation,
aligned controls and containment. Full lint has zero errors and 127 existing
warnings; changed-file lint and TypeScript checks passed. The fresh UI review
returned `ship`; it is a surface review, not a backend/security audit.

The generated migration was inspected and applied transactionally only to the
fixed disposable CI schema. Its legacy migration history is bootstrapped
separately, so this did not replay or fabricate ledger entries. Both tables,
seven constraints and five valid indexes were checked. Audit fixtures were
removed; the pre-existing ten latency samples were preserved.

A rolled-back 100,000-event fixture measured 12.1 ms for the three-read list
helper (ten returned rows, 2,250 matches). Count/list plans used
`admin_audit_events_actor_time_idx` and measured 0.868/0.173 ms; coverage used
its primary key at 0.012 ms. This establishes the tested local query shape,
not a production latency guarantee.

Before development rollout, apply migration `0054_admin_audit_history` using
the [Pi database migration runbook](raspberry-pi-database-migrations.md), verify
the ledger/schema and health, then deploy this branch. Step 6 has not yet been
applied to the Pi development or production databases.
