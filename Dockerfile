# Multi-stage build for TypeScript Node.js backend

# =========================
# Builder
# =========================
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Force apt to use HTTPS: the network's SNI-based whitelist firewall can't
# inspect plain HTTP (port 80), so it silently drops those connections.
RUN sed -i 's|http://deb.debian.org|https://deb.debian.org|g; s|http://security.debian.org|https://security.debian.org|g' \
    /etc/apt/sources.list /etc/apt/sources.list.d/*.sources 2>/dev/null || true

# Native dependencies required to build canvas
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    libcairo2-dev \
    libjpeg-dev \
    libpango1.0-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build


# =========================
# Production
# =========================
FROM node:22-bookworm-slim AS production

WORKDIR /app

# Force apt to use HTTPS: the network's SNI-based whitelist firewall can't
# inspect plain HTTP (port 80), so it silently drops those connections.
RUN sed -i 's|http://deb.debian.org|https://deb.debian.org|g; s|http://security.debian.org|https://security.debian.org|g' \
    /etc/apt/sources.list /etc/apt/sources.list.d/*.sources 2>/dev/null || true

# Runtime libraries required by canvas
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libjpeg62-turbo \
    libpango-1.0-0 \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./

# Install production dependencies
RUN npm ci --omit=dev

# Copy compiled application
COPY --from=builder /app/dist ./dist

# Expose port
EXPOSE 3001

ENV NODE_ENV=production

# Start application
CMD ["node", "dist/server.js"]