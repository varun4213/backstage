# Multi-stage build for Backstage frontend
FROM node:18.20.8-alpine as builder

# Install Python for node-gyp
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files for caching
COPY package.json yarn.lock ./
COPY packages/app/package.json ./packages/app/
COPY packages/*/package.json ./packages/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the frontend
RUN yarn tsc && yarn build:frontend --config ../../app-config.yaml

# Production stage
FROM nginx:alpine
COPY --from=builder /app/packages/app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY packages/app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
