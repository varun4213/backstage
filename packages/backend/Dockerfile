# This dockerfile builds an image for the backend package.
# It should be executed with the root of the repo as docker context.
#
# Before building this image, be sure to have run the following commands in the repo root:
#
# yarn install --immutable
# yarn tsc
# yarn build:backend
#
# Once the commands have been run, you can build the image using `yarn build-image`

# Multi-stage build for Backstage backend
FROM node:18.20.8-alpine AS builder

# Set Python interpreter for node-gyp and enable Corepack for Yarn 4
ENV PYTHON=/usr/bin/python3

# Install build dependencies
RUN apk add --no-cache python3 make g++ sqlite-dev && \
    corepack enable && \
    corepack prepare yarn@4.4.1 --activate

WORKDIR /app


# Copy all monorepo sources needed for workspace install
COPY . .

# Remove src directories to speed up install (optional, can be commented out if needed for build)
# RUN find packages \! -name "package.json" -mindepth 2 -maxdepth 2 -exec rm -rf {} \+

# Install dependencies
RUN yarn install --immutable


# Build the backend
RUN yarn tsc
RUN yarn build:backend

# Production stage
FROM node:18.20.8-alpine

# Set Python interpreter for node-gyp and enable Corepack for Yarn 4
ENV PYTHON=/usr/bin/python3

# Install runtime dependencies
RUN apk add --no-cache python3 make g++ sqlite-dev && \
    corepack enable && \
    corepack prepare yarn@4.4.1 --activate

# From here on we use the least-privileged node user
USER node
WORKDIR /app

# Copy yarn configuration
COPY --from=builder --chown=node:node /app/.yarn ./.yarn
COPY --from=builder --chown=node:node /app/.yarnrc.yml ./
COPY --from=builder --chown=node:node /app/backstage.json ./

# Copy package files for production install
COPY --from=builder --chown=node:node /app/yarn.lock /app/package.json /app/packages/backend/dist/skeleton.tar.gz ./
RUN tar xzf skeleton.tar.gz && rm skeleton.tar.gz

# Install production dependencies
RUN yarn workspaces focus --all --production && rm -rf "$(yarn cache clean)"

# Copy built backend
COPY --from=builder --chown=node:node /app/packages/backend/dist/bundle.tar.gz ./
RUN tar xzf bundle.tar.gz && rm bundle.tar.gz

# Copy configuration files
COPY --chown=node:node app-config*.yaml ./

# This switches many Node.js dependencies to production mode
ENV NODE_ENV=production

# This disables node snapshot for Node 18 to work with the Scaffolder
ENV NODE_OPTIONS="--no-node-snapshot"

EXPOSE 7007
CMD ["node", "packages/backend", "--config", "app-config.yaml"]
