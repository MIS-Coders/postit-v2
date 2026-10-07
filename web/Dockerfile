FROM oven/bun:1

WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

# Svelte memuat modul database saat proses build; nilai ini hanya placeholder.
# DATABASE_URL dan secret asli tetap diberikan Docker Compose saat container runtime.
RUN DATABASE_URL=postgres://build:build@localhost:5432/build \
    BETTER_AUTH_SECRET=build-placeholder-secret-please-replace \
    ORIGIN=http://localhost:5173 \
    PUBLIC_API_URL=http://localhost:3018 \
    bun run build

EXPOSE 5173

CMD ["bun", "build/index.js"]
