FROM node:22-alpine AS builder
WORKDIR /app
ARG NPM_REGISTRY=http://192.168.178.131:4873/
RUN npm config set registry "$NPM_REGISTRY" && npm config set replace-registry-host always
COPY package.json package-lock.json tsconfig.json ./
COPY shared/package.json shared/package.json
COPY server/package.json server/package.json
COPY web/package.json web/package.json
COPY admin/package.json admin/package.json
RUN npm ci --ignore-scripts --no-audit --no-fund
COPY shared shared
COPY server server
RUN npm run build -w shared && npm run build -w server
RUN npm prune --omit=dev --ignore-scripts --no-audit --no-fund \
    && mkdir -p server/node_modules shared/node_modules

FROM node:22-alpine AS runtime
WORKDIR /app/server
ENV NODE_ENV=production
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/shared/package.json /app/shared/package.json
COPY --from=builder /app/shared/dist /app/shared/dist
COPY --from=builder /app/shared/node_modules /app/shared/node_modules
COPY --from=builder /app/server/package.json ./package.json
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules
USER node
EXPOSE 4000
CMD ["node", "dist/index.js"]
