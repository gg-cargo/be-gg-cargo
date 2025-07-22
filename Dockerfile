# Build stage
FROM node:18-alpine AS builder

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
FROM node:18-alpine AS production

# Create app user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy built application from builder stage
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist

# Copy configuration files
COPY --chown=nestjs:nodejs config ./config
COPY --chown=nestjs:nodejs migrations ./migrations
COPY --chown=nestjs:nodejs seeders ./seeders
COPY --chown=nestjs:nodejs .sequelizerc /app/.sequelizerc

# Copy fonts
COPY --chown=nestjs:nodejs fonts ./fonts

# Create public directory for PDF files
RUN mkdir -p public/pdf && chown -R nestjs:nodejs public

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