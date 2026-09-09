# =========================
# Stage 1: Build
# =========================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

# =========================
# Stage 2: Runtime
# =========================
FROM node:22-alpine AS runtime

WORKDIR /app

RUN apk update && \
    apk upgrade --no-cache libssl3 libcrypto3

RUN addgroup -S nodeapp && \
    adduser -S nodeapp -G nodeapp && \
    rm -rf /usr/local/lib/node_modules/npm \
           /usr/local/lib/node_modules/corepack \
           /usr/local/bin/npm \
           /usr/local/bin/npx \
           /usr/local/bin/corepack

COPY --from=builder --chown=nodeapp:nodeapp /app/node_modules ./node_modules
COPY --from=builder --chown=nodeapp:nodeapp /app/app.js ./app.js
COPY --from=builder --chown=nodeapp:nodeapp /app/server.js ./server.js
COPY --from=builder --chown=nodeapp:nodeapp /app/package.json ./package.json

USER nodeapp

EXPOSE 3000

CMD ["node", "server.js"]
