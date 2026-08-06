FROM node:22-alpine

RUN apk add --no-cache curl

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY . .

RUN addgroup -S nodeapp && \
    adduser -S nodeapp -G nodeapp && \
    chown -R nodeapp:nodeapp /app

USER nodeapp

EXPOSE 3000

CMD ["node", "app.js"]
