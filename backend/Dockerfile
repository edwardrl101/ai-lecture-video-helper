docker
# --- STAGE 1: Build ---
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install ALL dependencies (including TypeScript)
COPY package*.json ./
RUN npm install

# Copy the source code and build the project
COPY . .
RUN npm run build

# --- STAGE 2: Runtime ---
FROM node:20-alpine AS runner
WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Copy ONLY the production dependencies (ignores devDependencies like TypeScript)
COPY package*.json ./
RUN apk add --no-cache ffmpeg ca-certificates && \
    npm install --omit=dev

# Copy the compiled JS from the builder stage
COPY --from=builder /app/dist ./dist

# Start the app
EXPOSE 3000
CMD ["node", "dist/utils/index.js"]