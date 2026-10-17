# Branch previews on the Raspberry Pi

Coolify manages disposable feature-branch deployments at
[`coolify.furkan-cengiz.com`](https://coolify.furkan-cengiz.com). Production and
development keep their existing Compose stacks, Watchtower image channels, cron
jobs, databases, and exact Cloudflare Tunnel routes. They are not managed by
Coolify.

## Open a preview

Push a branch other than `main` or `develop`. The **Branch previews** GitHub
Actions workflow checks the branch, builds ARM64 images on GitHub runners, and
creates or updates its service in the dedicated Coolify preview environment.
The final deployment step links to the URL in the Actions run summary.

URLs use `dictionary-<readable-branch>-<12-character-hash>.furkan-cengiz.com`.
The hash includes the repository and exact branch name, so names containing
slashes, Unicode, or the same readable slug still receive different URLs. A
later push keeps the URL and replaces its deployed revision.

Deleting the branch queues deletion of that branch's owned Coolify service,
including its disposable database. Missing resources count as successful
cleanup. If the branch exists again, cleanup skips it. Automatic deletion events
use the workflow from the repository's default branch: **this workflow must be
merged into that branch before automatic cleanup becomes active**. A preview
deployment from a draft PR alone does not activate default-branch cleanup.
GitHub also does not generate a delete event when more than three branches are
deleted at once; dispatch cleanup separately for those absent branches.

The workflow has manual **deploy** and **delete** actions. Set `branch` to the
exact branch name; manual deletion refuses a branch that still exists. The
manual workflow must also be present on the default branch before GitHub offers
dispatch. During initial setup, an operator can run the same lifecycle script
from the reviewed checkout with the configured variables in a private shell.

## Administrator access

The initial administrator uses the GitHub account email selected during setup.
The generated initial credential is stored on the Pi in the root-readable file
`/data/coolify/initial-admin.json` (mode `0600`). Retrieve it in your own trusted
terminal:

```bash
ssh -t furkipie 'sudo cat /data/coolify/initial-admin.json'
```

Store that credential in your password manager. The file is an installation
record; it does not automatically follow later password changes. Application
containers and the repository never receive this administrator password.

## Deployment boundaries

Each preview is one Coolify custom Compose service containing:

- The standalone app image built with that branch's exact public URL.
- PostgreSQL 17 with an isolated password in the preview's own Docker network.
- A private HTTP fixture for the application's Upstash rate-limit boundary.

The database is built from `scripts/ci/database.ts`'s disposable local database,
using today's Drizzle schema and the synthetic `kitap` dictionary entry. It is
exported **before** browser tests create synthetic accounts. No production or
development snapshot, real user account, integration secret, or database
credential is used. Legacy migration history cannot initialize an empty auth
schema, so this fixture follows the existing guarded CI schema-push path rather
than replaying historical migrations.

Database data lives in a bounded 128 MiB `tmpfs`. A database container restart or
replacement restores the fixture and discards preview edits. This makes each
code revision safe to test against its own schema; previews are unsuitable for
durable data. Limits are 768 MiB for the app, 256 MiB for PostgreSQL (including
its data), and 64 MiB for the rate-limit fixture. Each preview consumes Pi
resources until its branch is removed.

Email delivery, OAuth provider credentials, upload credentials, Meilisearch,
push delivery, and external cron scheduling are not configured. reCAPTCHA has
its public build key but no real verification secret, so protected submission
flows cannot pass verification. The private Upstash fixture accepts only the
existing CI sliding-window protocol and does not enforce real visitor quotas.
Use development or a separately configured integration environment to test those
external services. Preview credentials are derived separately for each branch
from a dedicated secret; they cannot authenticate to existing databases.

Cloudflare terminates public HTTPS and forwards matching preview hostnames to
the loopback Coolify HTTP proxy at `127.0.0.1:8088`. The origin sets
`X-Forwarded-Proto: https`. Coolify routes the app to internal port `3000`; there
are no published preview app or database ports. A response middleware adds
`X-Robots-Tag: noindex, nofollow` and `X-Preview-Commit: <full-commit-sha>`.
Deployment succeeds only when `/api/health` returns HTTP 200 with the expected
commit header and noindex. These preview URLs are publicly reachable and contain
only disposable synthetic data.

Coolify attaches the proxy and all three containers to one network owned by that
preview's resource UUID. Previews do not join the global `coolify` network or an
existing application network. The Compose input deliberately declares no extra
networks: Coolify's deletion API removes its UUID network but leaves additional
Compose networks behind. The database has no published port or public router;
its Docker network permits outbound connections.

## GitHub configuration

Configure these repository secrets without committing their values:

| Secret | Purpose |
| --- | --- |
| `COOLIFY_TOKEN` | Dedicated Coolify API token with `read`, `write`, and `deploy` abilities |
| `PREVIEW_SECRET` | Independently generated secret of at least 32 characters used to derive preview-only credentials |
| `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN` | Existing Docker Hub image publishing credentials |
| `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` | Existing public Next.js build configuration |

The Coolify token needs no `root` or `read:sensitive` ability. Store these
nonsecret repository variables:

| Variable | Value or role |
| --- | --- |
| `COOLIFY_URL` | `https://coolify.furkan-cengiz.com` |
| `COOLIFY_PROJECT_UUID` | Dedicated preview project UUID |
| `COOLIFY_ENVIRONMENT_UUID` | Dedicated preview environment UUID |
| `COOLIFY_SERVER_UUID` | Pi server UUID |
| `COOLIFY_DESTINATION_UUID` | Pi Docker destination UUID, required when the server has multiple destinations |
| `PREVIEW_PROJECT` | `dictionary` (default) |
| `PREVIEW_BASE_DOMAIN` | `furkan-cengiz.com` (default) |
| `PREVIEW_IMAGE_REPOSITORY` | `furki4/turkish-dictionary-app` (default) |

Keep this project/environment dedicated to previews; do not add shared
production environment variables there. The default Docker Hub repository must
allow public image pulls. App tags are `preview-<branch-hash>-<full-sha>`;
database tags are `preview-db-<full-sha>`. Neither `latest` nor `development` is
modified by this workflow. Registry images are retained after branch deletion
and can be pruned separately by tag prefix when no preview uses them.

The workflow runs only for this repository's branch pushes, branch deletions,
and explicit dispatches. It does not deploy fork pull requests. Lifecycle work
is serialized by repository and exact branch, and the script checks the live
GitHub ref before every create, update, start, and delete decision. An older run
cannot deploy a different current head. A deleted and recreated branch prevents
a queued delete from removing the recreated branch's preview. Like any two
independent APIs, a ref change can occur just after a check; the next serialized
branch event reconciles that state.

Lifecycle jobs use `queue: max` so a late stale deployment does not replace a
pending branch-deletion job. GitHub permits up to 100 pending jobs in that
concurrency group; an overflow or manually cancelled cleanup needs a manual
cleanup run.

Ownership requires both the deterministic preview name and the exact marker
containing repository, branch, identity, and environment UUID. A collision or
modified marker stops automation for manual inspection. Cleanup does not invoke
global Docker pruning. Coolify queues actual container cleanup, so check its
queue and service logs if a removed service leaves containers behind.
Cleanup refuses an unavailable server before removing metadata, preserving the
ability to retry. A successful API request is reported as **cleanup queued**;
the API's immediate metadata removal does not prove Docker cleanup is complete.
If connectivity fails during the request, inspect the Pi's actual containers
before considering the preview removed.

## Installation and recovery

The initial installation pins Coolify **4.4.6** in `/data/coolify/source/`, with
its management port bound to `127.0.0.1:8000`, websocket ports bound to loopback,
and its HTTP proxy bound to `127.0.0.1:8088`. Management uses the `coolify` Docker
network and separate persistent storage. The installation backs up the prior
Cloudflare configuration before adding the dashboard and wildcard preview
ingress rules after all existing exact hostnames. Wildcard DNS points at the
existing named tunnel; existing service DNS records remain authoritative.

For a failed preview, open its Actions run and Coolify service. API failures
report only status codes to avoid printing response bodies containing secrets.
Check image availability, the configured project/environment/destination UUIDs,
database health, Coolify queue status, and the proxy middleware. Redeploy the
current branch after correcting configuration. If the branch was deleted, run
manual cleanup for its exact name. An ownership failure needs inspection before
changing any marker; never bypass it by choosing another service UUID.

To suspend previews, disable the **Branch previews** workflow and stop its
owned services in Coolify. Do not stop the existing production or development
Compose stacks. To remove Coolify, first remove its owned preview services,
then stop only `/data/coolify/source/`'s Compose stack and its `coolify-proxy`.
Remove only the added dashboard/wildcard ingress and DNS records, or restore the
installation backup after checking for later Cloudflare changes. Leave existing
exact ingress routes and DNS records intact. Keep `/data/coolify` until its
management data and administrator credential have been backed up or are no
longer needed.

The API contract is checked against the pinned release's
[service controller](https://github.com/coollabsio/coolify/blob/v4.4.6/app/Http/Controllers/Api/ServicesController.php)
and [routing](https://github.com/coollabsio/coolify/blob/v4.4.6/routes/api.php).
Run `bun test scripts/preview/*.test.mjs` for lifecycle and ownership edge cases. Keep the full repository build/browser checks green before
publishing preview images. GitHub's documented
[`queue: max`](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
is newer than actionlint 1.7.12's schema. Validate all remaining workflow syntax
using a temporary copy with only the two `queue: max` lines removed, and verify
the original workflow through an actual GitHub Actions run. Do not suppress
other validation errors.
