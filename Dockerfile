# Use Node.js 18 Alpine as the base image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /app

# Copy package.json first for better build caching
COPY package*.json ./

# Install production dependencies
RUN npm install --production

# Copy application source code
COPY . .

# Expose application port
EXPOSE 3000

# Start the application
CMD ["node", "index.js"]
