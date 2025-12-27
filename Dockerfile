# Build stage
FROM node:22-alpine AS builder

# Install dependencies required for canvas
RUN apk add --no-cache \
  python3 \
  make \
  g++ \
  cairo-dev \
  jpeg-dev \
  pango-dev \
  giflib-dev \
  pixman-dev

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS production

# Install runtime dependencies for canvas
RUN apk add --no-cache \
  cairo \
  jpeg \
  pango \
  giflib \
  pixman

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install build dependencies for canvas (temporary)
RUN apk add --no-cache \
  python3 \
  make \
  g++ \
  cairo-dev \
  jpeg-dev \
  pango-dev \
  giflib-dev \
  pixman-dev

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Remove build dependencies after install (keep runtime deps)
RUN apk del python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev pixman-dev

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy configuration files
COPY --chown=nestjs:nodejs config ./config
COPY --chown=nestjs:nodejs migrations ./migrations
COPY --chown=nestjs:nodejs seeders ./seeders
COPY --chown=nestjs:nodejs .sequelizerc /app/.sequelizerc

# Copy fonts
COPY --chown=nestjs:nodejs fonts ./fonts

# Copy public directory (including logos and other static files)
COPY --chown=nestjs:nodejs public ./public

# Ensure public subdirectories exist and set proper permissions
RUN mkdir -p public/pdf public/pdf/labels public/excel public/uploads && chown -R nestjs:nodejs public

# Copy healthcheck and entrypoint
COPY --chown=nestjs:nodejs healthcheck.js /app/healthcheck.js
COPY --chown=nestjs:nodejs entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start pakai entrypoint script
CMD ["sh", "/app/entrypoint.sh"] 