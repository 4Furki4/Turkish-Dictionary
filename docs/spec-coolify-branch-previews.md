---
title: Coolify branch previews on the Raspberry Pi
type: feature
created: 2026-10-17
status: in-review
baseline_commit: f87aafdc24558fdd716be7825f1932b225704e05
review_loop_iteration: 0
context:
  - AGENTS.md
  - docs/raspberry-pi-deployments.md
  - docs/ci.md
---

<frozen-after-approval reason="human-owned intent">

## Intent

**Problem:** Pushing a feature branch does not currently provide a separately deployed dictionary app with a predictable URL. Reviewing a branch should not require replacing development or production.

**Approach:** Install Coolify on the existing Raspberry Pi and add a GitHub Actions workflow that builds ARM64 images outside the Pi, creates or updates one preview per feature branch, and deletes its resources when the branch is deleted. Use a readable project and branch slug with a collision-resistant suffix in the hostname.

## Boundaries & Constraints

**Always:** Keep existing production/development containers, database contents, image tags, cron jobs, and tunnel routes working. Install Coolify in its own directory and Docker network. Use the existing Cloudflare Tunnel for public HTTPS. Keep database ports private. Use isolated disposable preview data and credentials. Build public Next.js URLs into each image. Preserve authentication origin checks. Record the installation and rollback procedure without checking in secrets. Use the existing GitHub account email for the Coolify administrator and generate a private initial password. Restrict preview deployment triggers to branches in this repository.

**Ask First:** Migrating an existing production service into Coolify, deleting existing data, changing the main/develop release behavior, purchasing a domain or paid service, or changing an established account credential.

**Never:** Expose a database publicly, reuse production credentials in previews, deploy public fork pull requests, change DNS records for existing services, or print secret values in logs. Do not merge the workflow branch without a separate instruction.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
| --- | --- | --- | --- |
| First push | New feature branch | Separate Coolify resource, private database, HTTPS URL | Failed deployment fails Actions with useful diagnostics |
| Later push | Existing preview branch | Same URL serves the new commit | Never replace another branch or an existing release |
| Concurrent pushes | Older and newer runs overlap | Only the latest branch head deploys | Serialize lifecycle changes and reject stale heads |
| Hostname collisions | Slashes, Unicode, long names, similar slugs | Valid distinct stable DNS labels | Deterministic hash suffix and length bound |
| Branch deletion | Existing preview | Remove only its app and disposable database resources | Missing resources count as successful cleanup |
| Protected branches | main or develop | Existing publishing workflow continues | Preview workflow skips these branches |
| Missing config | Coolify/API/registry unavailable | Action fails without exposing tokens | No fallback to production resources |

</frozen-after-approval>

## Code Map

- `.github/workflows/test.yml` — existing protected branch CI and ARM64 release publishing.
- `Dockerfile` — existing standalone Next.js runtime and public build arguments.
- `scripts/ci/` — existing disposable PostgreSQL schema and synthetic fixtures.
- `src/env.mjs`, `src/lib/auth.ts` — runtime validation and authentication origins.
- `docs/raspberry-pi-deployments.md` — current ports and Cloudflare routing.
- Pi `/etc/cloudflared/config.yml` — existing named tunnel routes; append preview routing before its catch-all.
- Pi `/data/coolify/` — new management service, database, SSH key, and proxy configuration.

## Tasks & Acceptance

**Execution:**
- [x] Pi `/data/coolify/source/` — install a pinned current release with private management ports, persistent storage, and an initial administrator; verify host connection and proxy.
- [x] Pi `/etc/cloudflared/config.yml` and Cloudflare DNS — add `coolify.turkce-sozluk.com` and wildcard preview routing without replacing existing hostnames; validate configuration and back it up first.
- [x] `scripts/preview/` — implement deterministic naming and Coolify create/update/delete lifecycle with precise ownership checks, stale-head protection, safe diagnostics, and preview-only database configuration.
- [x] `.github/workflows/preview.yml` — build ARM64 app and disposable database images in Actions, deploy after successful checks, and clean up deleted branches; configure its GitHub secrets and variables.
- [x] `scripts/preview/` tests — cover lifecycle decisions, naming boundaries, stale heads, failure handling, and cleanup ownership.
- [x] `docs/coolify-previews.md` — document dashboard access, URL naming, administrator credential retrieval, lifecycle, limitations, and recovery.
- [ ] Workflow branch — publish a reviewable branch/PR and verify a real preview deployment, repeat push, and disposable cleanup where permitted without merging.

**Acceptance Criteria:**
- Given the configured Pi and repository, when a feature branch is pushed, then its HTTPS URL renders that branch and reports healthy application/database status.
- Given an existing preview, when a subsequent commit is pushed, then the URL stays stable and its deployed revision changes to the current head.
- Given the working installation, when main/develop health endpoints are checked, then both remain healthy and their containers retain their previous configuration.
- Given a deleted feature branch, when cleanup completes, then its preview resources are absent and other applications are intact.

## Spec Change Log

- Review patches: use only Coolify's automatically owned resource network so branch cleanup does not leak Compose networks; retain metadata when a server is unavailable and distinguish queued cleanup from completed runtime removal; retain pending lifecycle jobs with GitHub's maximum queue. Preserve URL identity, ownership checks, isolated credentials, and existing release channels.

## Design Notes

Use first-level hostnames such as `dictionary-feature-search-a1b2c3d4.turkce-sozluk.com` so ordinary domain certificates cover the previews. Coolify's own PR-number preview templates do not provide arbitrary branch creation and naming; the Actions lifecycle owns that mapping. The dashboard is `coolify.turkce-sozluk.com`. Existing services continue using their direct tunnel routes. New preview data is disposable and contains no real user accounts or production integration secrets.

## Verification

- Focused Bun tests and workflow/YAML validation pass.
- `bun run build` passes with the repository's disposable build environment; report any environmental blocker explicitly.
- Coolify's own health checks and its local SSH connection succeed.
- Public HTTPS preview, locale routes, and `/api/health` respond correctly.
- Existing production/development `/api/health` endpoints remain healthy after installation and tunnel routing changes.

Local validation: production build through `bun run ci:build` passed; lint passed; 103 Jest suites and 645 tests passed (one suite and 15 tests skipped). Focused lifecycle tests pass. Current GitHub queue syntax is verified against GitHub documentation; actionlint's older schema is checked using a temporary copy removing only the two queue declarations. Live workflow verification remains in progress.

## Suggested Review Order

- Follow feature pushes through validation, ARM64 publishing, deployment, and branch cleanup.
  [preview.yml:1](../.github/workflows/preview.yml#L1)
- Inspect ownership and fresh-head checks at each lifecycle mutation.
  [lifecycle.mjs:20](../scripts/preview/lifecycle.mjs#L20)
- Check isolated credentials, resource limits, fixture services, and proxy headers.
  [compose.mjs:6](../scripts/preview/compose.mjs#L6)
- Review URL naming and collision-resistant branch identity.
  [identity.mjs:5](../scripts/preview/identity.mjs#L5)
- Check failure, ownership, stale-head, and cleanup edge cases.
  [preview.test.mjs:1](../scripts/preview/preview.test.mjs#L1)
- Read operational limits and recovery procedures.
  [coolify-previews.md:1](coolify-previews.md#L1)
