# Production Dockerfile for Student Assessment & Learning Portal v2
FROM node:20-alpine AS builder

WORKDIR /app

# Copy root and package files
COPY package.json ./
COPY frontend/package.json frontend/
COPY backend/package.json backend/

# Install dependencies
RUN cd frontend && npm install
RUN cd backend && npm install

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
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/database ./backend/database
COPY --from=builder /app/frontend/dist ./frontend/dist

# Install production dependencies only
RUN cd backend && npm install --only=production

EXPOSE 5000

CMD ["node", "backend/dist/index.js"]
