# Build the Vite client. VITE_* values are inlined at build time, so they must
# be provided as build args (not runtime env).
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ARG VITE_CESIUM_ION_TOKEN
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CESIUM_ION_TOKEN=$VITE_CESIUM_ION_TOKEN

RUN npm run build

# Serve the built SPA with Vite preview (handles client-side routing fallback).
FROM node:22-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/vite.config.ts ./vite.config.ts

EXPOSE 5173

CMD ["npx", "vite", "preview", "--host", "0.0.0.0", "--port", "5173"]
