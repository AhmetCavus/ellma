FROM node:22-alpine AS builder
WORKDIR /app
ARG NPM_REGISTRY=http://192.168.178.131:4873/
RUN npm config set registry "$NPM_REGISTRY" && npm config set replace-registry-host always
COPY package.json package-lock.json tsconfig.json ./
COPY shared/package.json shared/package.json
COPY server/package.json server/package.json
COPY web/package.json web/package.json
RUN npm ci --ignore-scripts --include=optional --no-audit --no-fund
COPY shared shared
COPY web web
ARG VITE_API_URL=https://ellma-api.yappai.de
ENV VITE_API_URL=$VITE_API_URL
# Operator details for the imprint; empty until the operator sets them in .env.
ARG VITE_LEGAL_NAME=""
ARG VITE_LEGAL_ADDRESS=""
ARG VITE_LEGAL_REPRESENTATIVE=""
ARG VITE_LEGAL_EMAIL=""
ARG VITE_LEGAL_PHONE=""
ARG VITE_LEGAL_REGISTER=""
ARG VITE_LEGAL_VAT_ID=""
ENV VITE_LEGAL_NAME=$VITE_LEGAL_NAME \
    VITE_LEGAL_ADDRESS=$VITE_LEGAL_ADDRESS \
    VITE_LEGAL_REPRESENTATIVE=$VITE_LEGAL_REPRESENTATIVE \
    VITE_LEGAL_EMAIL=$VITE_LEGAL_EMAIL \
    VITE_LEGAL_PHONE=$VITE_LEGAL_PHONE \
    VITE_LEGAL_REGISTER=$VITE_LEGAL_REGISTER \
    VITE_LEGAL_VAT_ID=$VITE_LEGAL_VAT_ID
RUN npm run build -w shared && npm run build -w web

FROM nginx:alpine AS runtime
ARG VITE_API_URL=https://ellma-api.yappai.de
COPY docker/nginx.conf /etc/nginx/templates/default.conf.template
ENV ELLMA_API_ORIGIN=$VITE_API_URL
# Only substitute our variable; nginx's own $uri etc. must stay untouched.
ENV NGINX_ENVSUBST_FILTER=ELLMA_
COPY --from=builder /app/web/dist /usr/share/nginx/html
EXPOSE 80
