FROM node:24 as builder

ENV CI=true

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application
RUN npm --no-git-tag-version version 1.0.0 --allow-same-version
RUN npm pack

FROM mcr.microsoft.com/devcontainers/javascript-node as runner

WORKDIR /app

COPY --from=builder /app/*.tgz /app/

# # Install the application package globally
RUN npm install -g /app/*.tgz

RUN mkdir /testapp
RUN cd /testapp && npm init -y

# ENV SHELL=/bin/bash
