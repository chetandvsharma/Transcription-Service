# ========= Builder Stage =========
FROM node:22-alpine AS builder
WORKDIR /app

# Install only production dependencies cleanly
COPY package*.json ./
RUN npm ci

# Copy source and build TypeScript
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ========= Production Stage =========
FROM node:22-alpine AS production

WORKDIR /app

# Run as non-root user (security best practice)
RUN addgroup --system appgroup && adduser --system --ingroup appgroup appuser
USER appuser

# Copy built app and node_modules from builder
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist
COPY --from=builder --chown=appuser:appgroup /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:appgroup /app/package*.json ./

ENV NODE_ENV=production
EXPOSE 8080

CMD ["node", "dist/server.js"]