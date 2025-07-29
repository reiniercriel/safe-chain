FROM node:18-alpine

# Install bash and basic utilities (Alpine uses apk, not apt-get)
RUN apk add --no-cache bash curl

# Create a test user to simulate real user environment (Alpine syntax)
RUN addgroup -S testuser && adduser -S testuser -G testuser -s /bin/bash

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Switch to test user
USER testuser

# Create home directory structure that bash expects
RUN mkdir -p /home/testuser

# Set environment variables for testing
ENV HOME=/home/testuser
ENV SHELL=/bin/bash

# Default command runs our test
CMD ["bash", "test/e2e/test-setup.sh"]