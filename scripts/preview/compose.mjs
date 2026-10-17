import { readFileSync } from "node:fs";
import { credential } from "./identity.mjs";

const integrationSource = readFileSync(new URL("./integrations.mjs", import.meta.url), "utf8");

export function previewCompose({ identity, images, sha, secret }) {
  const password = credential(secret, identity, "postgres");
  const authSecret = credential(secret, identity, "auth");
  const upstashToken = credential(secret, identity, "upstash");
  const middleware = `${identity.name}-headers`;
  const appEnvironment = {
    NODE_ENV: "production", HOSTNAME: "0.0.0.0", PORT: "3000",
    DATABASE_URL: `postgresql://preview:${password}@database:5432/dictionary_preview?sslmode=disable`,
    DATABASE_HOST: "database", DATABASE_PORT: "5432", DATABASE_USERNAME: "preview",
    DATABASE_PASSWORD: password, DATABASE_DATABASE: "dictionary_preview",
    AUTH_SECRET: authSecret, BETTER_AUTH_SECRET: authSecret, BETTER_AUTH_URL: identity.url,
    NEXT_PUBLIC_APP_URL: identity.url, NEXT_PUBLIC_URL: identity.url,
    AUTH_DISCORD_ID: "preview-disabled", AUTH_DISCORD_SECRET: "preview-disabled",
    AUTH_GOOGLE_ID: "preview-disabled", AUTH_GOOGLE_SECRET: "preview-disabled",
    CRON_SECRET: credential(secret, identity, "cron"), RECAPTCHA_SECRET_KEY: "preview-disabled",
    UPSTASH_REDIS_REST_URL: "http://integrations:8179", UPSTASH_REDIS_REST_TOKEN: upstashToken,
  };
  return {
    services: {
      app: {
        image: images.app, restart: "unless-stopped", environment: appEnvironment,
        depends_on: { database: { condition: "service_healthy" }, integrations: { condition: "service_started" } },
        mem_limit: "768m", cpus: 1,
        healthcheck: {
          test: ["CMD", "node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"],
          interval: "15s", timeout: "5s", retries: 12, start_period: "30s",
        },
        labels: {
          [`traefik.http.middlewares.${middleware}.headers.customresponseheaders.X-Robots-Tag`]: "noindex, nofollow",
          [`traefik.http.middlewares.${middleware}.headers.customresponseheaders.X-Preview-Commit`]: sha,
          "coolify.traefik.middlewares": middleware,
          "com.centurylinklabs.watchtower.enable": "false",
        },
      },
      database: {
        image: images.database, restart: "unless-stopped",
        environment: { POSTGRES_USER: "preview", POSTGRES_PASSWORD: password, POSTGRES_DB: "dictionary_preview" },
        tmpfs: ["/var/lib/postgresql/data:size=128m"],
        mem_limit: "256m", cpus: 0.5,
        healthcheck: { test: ["CMD", "pg_isready", "-h", "127.0.0.1", "-U", "preview", "-d", "dictionary_preview"], interval: "5s", timeout: "5s", retries: 20 },
        labels: { "com.centurylinklabs.watchtower.enable": "false" },
      },
      integrations: {
        image: images.app, command: ["node", "--input-type=module", "-e", integrationSource],
        restart: "unless-stopped",
        environment: { PREVIEW_UPSTASH_TOKEN: upstashToken }, mem_limit: "64m", cpus: 0.25,
        labels: { "com.centurylinklabs.watchtower.enable": "false" },
      },
    },
  };
}
