# Multi-stage build for Backstage frontend
FROM node:18.20.8-alpine AS builder

# Install Python for node-gyp and enable Corepack for Yarn 4
RUN apk add --no-cache python3 make g++ && \
    corepack enable && \
    corepack prepare yarn@4.4.1 --activate

WORKDIR /app

# Copy package files for caching
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn/releases ./.yarn/releases
COPY packages/app/package.json ./packages/app/
COPY packages/*/package.json ./packages/

# Install dependencies
RUN yarn install --immutable

# Copy source code
COPY . .

# Build the frontend
RUN yarn tsc && yarn build:frontend

# Production stage
FROM nginx:alpine
COPY --from=builder /app/packages/app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY packages/app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
