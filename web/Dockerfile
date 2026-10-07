FROM oven/bun:1

WORKDIR /app

ENV NODE_ENV=production

COPY package.json bun.lock ./

RUN bun install --frozen-lockfile

COPY . .

RUN bun run build

EXPOSE 5173

CMD ["bun", "build/index.js"]
