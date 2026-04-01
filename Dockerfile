# Stage 1: Build the application
FROM node:22-alpine AS builder

# Set the working directory
WORKDIR /app

COPY package.json ./package.json
RUN apk add --no-cache openssl
RUN npm i --legacy-peer-deps

COPY app ./app
COPY components ./components
COPY i18n ./i18n
COPY lib ./lib
COPY messages ./messages
COPY public ./public

COPY next.config.ts ./next.config.ts
COPY package-lock.json ./package-lock.json
COPY *.ts ./
COPY *.json ./
COPY *.mjs ./
COPY start.sh ./start.sh

# Prisma
COPY prisma/schema.prisma ./prisma/schema.prisma
COPY prisma/migrations ./prisma/migrations
COPY prisma/seed.ts ./prisma/seed.ts
RUN npx prisma generate

# Set environment variable for runtime
ENV NODE_ENV=production

# Expose the port your app runs on
EXPOSE 3000

# Start the Next.js application
ENTRYPOINT ["sh", "start.sh"] 