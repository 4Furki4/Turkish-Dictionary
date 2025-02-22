FROM oven/bun:alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Add wait-for-db script
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Wait for database and then build
RUN chmod +x /app/scripts/wait-for-db.ts && \
    bun run /app/scripts/wait-for-db.ts && \
    bun run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

# Copy built assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["bun", "server.js"]