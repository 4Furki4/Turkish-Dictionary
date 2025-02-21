FROM oven/bun:alpine AS base

# We'll use pre-built artifacts, so we only need the runtime stage
FROM base AS runner
WORKDIR /app

# Copy pre-built artifacts
COPY .next ./.next
COPY public ./public
COPY node_modules ./node_modules
COPY package.json ./
COPY bun.lockb ./

EXPOSE 3000
CMD ["bun", "start"]