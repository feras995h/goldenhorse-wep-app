# Multi-stage build for Golden Horse Shipping System
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY server/package*.json ./server/
COPY client/package*.json ./client/

# Install dependencies (including dev dependencies for build)
RUN npm install && npm cache clean --force
RUN cd server && npm install && npm cache clean --force
RUN cd client && npm install && npm cache clean --force

# Build the application
FROM base AS builder
WORKDIR /app

# Copy source code
COPY . .

# Install all dependencies for build
RUN npm install
RUN cd server && npm install
RUN cd client && npm install

# Build client
RUN cd client && npm run build

# Production image
FROM base AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/server ./server
COPY --from=builder --chown=nodejs:nodejs /app/client/build ./client/build
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Install production dependencies for server
RUN cd server && npm ci --only=production

# Create necessary directories
RUN mkdir -p /app/server/uploads /app/server/logs /app/server/backups
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node server/src/scripts/healthCheck.js || exit 1

# Start the application
CMD ["node", "server/src/server.js"]
