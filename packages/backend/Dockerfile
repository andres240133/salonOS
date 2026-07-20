FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/
COPY tsconfig.json ./
COPY packages/backend/tsconfig.json ./packages/backend/

RUN npm ci --workspace=packages/backend --include-workspace-root

COPY packages/backend/src ./packages/backend/src

RUN npm run build --workspace=packages/backend

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./
COPY packages/backend/package*.json ./packages/backend/

RUN npm ci --workspace=packages/backend --omit=dev --include-workspace-root

COPY --from=builder /app/packages/backend/dist ./packages/backend/dist

EXPOSE 3000

CMD ["node", "packages/backend/dist/app.js"]
