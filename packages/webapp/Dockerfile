# Stage 1: Build
FROM node:24-alpine@sha256:d32cdf619f63fe0471182d08996dd516c6275bb5fd31ae06e55a570bd9e1ad43 AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@11.23.0 --ignore-scripts --no-audit --no-fund
ENV HUSKY=0
ENV NODE_OPTIONS=--max-old-space-size=2560

# Copy package files for dependency installation
COPY --chown=node:node package.json pnpm-lock.yaml pnpm-workspace.yaml lerna.json ./
COPY --chown=node:node packages/webapp/package.json ./packages/webapp/
COPY --chown=node:node shared ./shared

# Install all dependencies (including devDependencies for build)
RUN pnpm install --frozen-lockfile --ignore-scripts

# Copy source code for webapp and dependencies
COPY --chown=node:node ./packages/webapp ./packages/webapp

# Build webapp package
RUN pnpm run build:webapp

# Stage 2: Nginx
FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:44e36330f74d4f3a1d4e222acca9e23b401fb87811a7597024502bb759c4dd49

# Copy nginx configuration
COPY --chown=nginx:nginx ./packages/webapp/nginx/sites/default.conf /etc/nginx/conf.d/default.conf

# Copy built webapp assets from builder stage
COPY --from=builder --chown=nginx:nginx /app/packages/webapp/dist /usr/share/nginx/html

USER 101:101

# Expose port
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:8080/
