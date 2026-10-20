# Production Dockerfile for Student Assessment & Learning Portal v2
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root, npm configs, and package files including lockfiles
COPY package.json .npmrc* ./
COPY frontend/package*.json frontend/.npmrc* frontend/
COPY backend/package*.json backend/

# Install dependencies using legacy-peer-deps to prevent npm peer dependency resolution errors
RUN cd frontend && npm install --legacy-peer-deps
RUN cd backend && npm install --legacy-peer-deps

# Copy source files
COPY frontend frontend/
COPY backend backend/

# Build frontend and backend
RUN npm run build

# Production Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy built dist files and package configs
COPY --from=builder /app/package.json ./
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/database ./backend/database
COPY --from=builder /app/frontend/dist ./frontend/dist

# Install production dependencies only
RUN cd backend && npm install --omit=dev --legacy-peer-deps

EXPOSE 5000

CMD ["node", "backend/dist/index.js"]
