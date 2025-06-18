# Use Node.js base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy everything else
COPY . .

# Expose Vite dev server port
EXPOSE 3000

# Start the frontend in dev mode
CMD ["npm", "run", "dev", "--", "--host"]
