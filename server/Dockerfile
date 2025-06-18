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

# Expose the backend dev port
EXPOSE 5000

# Start the dev server
CMD ["npm", "run", "dev"]