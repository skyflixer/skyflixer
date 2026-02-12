# Use official Node.js 18 LTS image (Alpine for smaller size)
FROM node:18-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first (for better Docker caching)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy entire src folder
COPY src ./src

# Expose port 7860 (Hugging Face default, can be changed via ENV)
EXPOSE 7860

# Set environment to production
ENV NODE_ENV=production
ENV PORT=7860

# Health check (optional but recommended for production)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:7860/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "src/server.js"]
