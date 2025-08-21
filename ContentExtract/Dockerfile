# Stage 1: Build dependencies
FROM node:20-bullseye-slim AS builder
WORKDIR /app

# Install only production dependencies via pnpm
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --prod --frozen-lockfile

# Copy app source
COPY . .

# Stage 2: Runtime image
FROM node:20-bullseye-slim AS runtime

# Install minimal Chromium and required libs
RUN apt-get update && apt-get install -y --no-install-recommends \
  chromium \
  ca-certificates \
  fonts-liberation \
  libnss3 \
  libxss1 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libx11-xcb1 \
  libxcomposite1 \
  libxrandr2 \
  libgbm1 \
  libasound2 \
  libpangocairo-1.0-0 \
  libxshmfence1 \
  libgtk-3-0 \
  && rm -rf /var/lib/apt/lists/*

# Copy app from builder
WORKDIR /app
COPY --from=builder /app .

# Set Puppeteer to use system chromium
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "index.js"]
