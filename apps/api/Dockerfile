FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

# Install workspace deps (apps/api depends on @probable/db locally; sdk/web aren't needed here)
COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json ./apps/api/package.json
COPY packages/db/package.json ./packages/db/package.json
RUN npm install

# Bring in source and generate the Prisma client for this container's platform
COPY packages/db ./packages/db
COPY apps/api ./apps/api
RUN cd packages/db && npx prisma generate

ENV NODE_ENV=production
EXPOSE 3001

# Pushes the current schema to DATABASE_URL before every boot, then starts
# the server. Safe against an empty/fresh database (this deploy's case);
# --accept-data-loss matters once real data exists — this project uses
# `prisma db push` everywhere (no migrations/ directory yet), so this just
# matches that. Worth moving to real `prisma migrate deploy` before this
# database holds anything you'd mind losing.
#
# Runs via tsx rather than a tsc-compiled dist/ — @probable/db is consumed as
# raw TypeScript (package.json "main": "./index.ts"), so a plain `node`
# runtime can't resolve it without a TS loader. tsx is the same runtime
# already used and verified in local dev.
CMD sh -c "cd packages/db && npx prisma db push --accept-data-loss --skip-generate && cd /app && npx tsx apps/api/src/index.ts"
