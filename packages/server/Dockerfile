# Stage 1: Build
FROM node:24-alpine@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@11.23.0 --ignore-scripts --no-audit --no-fund
ENV HUSKY=0

# Copy package files for dependency installation
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml lerna.json ./
COPY --chown=node:node packages/server/package.json ./packages/server/
COPY --chown=node:node shared ./shared

# Install all dependencies (including devDependencies for build). The lockfile
# is part of the reviewed build input, so avoid re-fetching registry metadata
# for every locked package while still verifying package integrity hashes.
RUN --mount=type=cache,id=bigcapital-pnpm,target=/pnpm/store,sharing=locked \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --frozen-lockfile --ignore-scripts --trust-lockfile

# Copy source code
COPY --chown=node:node ./packages/server ./packages/server

# Build NestJS application
RUN pnpm run build:server --skip-nx-cache

# Stage 2: Production
FROM node:24-alpine@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS production

WORKDIR /app

# Install pnpm for production
RUN npm install -g pnpm@11.23.0 --ignore-scripts --no-audit --no-fund
ENV HUSKY=0

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy package files for production dependency installation
COPY --chown=nodejs:nodejs package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=nodejs:nodejs packages/server/package.json ./packages/server/
COPY --chown=nodejs:nodejs shared ./shared

# Install only production dependencies. Reuse the builder's content-addressed
# package cache and trust the same reviewed, frozen lockfile.
RUN --mount=type=cache,id=bigcapital-pnpm,target=/pnpm/store,sharing=locked \
    pnpm config set store-dir /pnpm/store && \
    pnpm install --prod --frozen-lockfile --ignore-scripts --trust-lockfile && \
    rm -rf \
      /usr/local/lib/node_modules/npm \
      /usr/local/lib/node_modules/corepack \
      /usr/local/lib/node_modules/pnpm \
      /opt/yarn-v1.22.22 && \
    rm -f \
      /usr/local/bin/npm \
      /usr/local/bin/npx \
      /usr/local/bin/corepack \
      /usr/local/bin/pnpm \
      /usr/local/bin/pnpx \
      /usr/local/bin/yarn \
      /usr/local/bin/yarnpkg

# mathjs ships development examples with their own stale dependency tree; the
# application never loads them, so keep them out of the production image.
RUN rm -rf /app/node_modules/.pnpm/mathjs@9.5.2/node_modules/mathjs/examples

# Copy built application from builder stage
COPY --from=builder --chown=nodejs:nodejs /app/packages/server/dist ./packages/server/dist

# Copy static assets (i18n, public, static directories)
COPY --from=builder --chown=nodejs:nodejs /app/packages/server/src/i18n ./packages/server/dist/i18n
COPY --from=builder --chown=nodejs:nodejs /app/packages/server/public ./packages/server/public
COPY --from=builder --chown=nodejs:nodejs /app/packages/server/static ./packages/server/static

# Copy database migration files (needed for running migrations)
COPY --from=builder --chown=nodejs:nodejs /app/packages/server/src/database ./packages/server/src/database

# Copy all shared packages from builder so newly added shared packages are included automatically
COPY --from=builder --chown=nodejs:nodejs /app/shared ./shared

# Set runtime environment variables (these should be provided at runtime via docker-compose or k8s)
ENV NODE_ENV=production
ENV NEW_RELIC_NO_CONFIG_FILE=true
ENV PORT=3000

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check - uses /api/system_db ping endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/api/system_db', (r) => {process.exit(r.statusCode >= 200 && r.statusCode < 300 ? 0 : 1)}).on('error', () => process.exit(1))"

# Start the application
CMD [ "node", "packages/server/dist/main.js" ]
