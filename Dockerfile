# https://www.digitalocean.com/community/tutorials/how-to-secure-a-containerized-node-js-application-with-nginx-let-s-encrypt-and-docker-compose
# https://www.digitalocean.com/community/tutorials/how-to-build-a-node-js-application-with-docker#step-3-%E2%80%94-writing-the-dockerfile

FROM node:22-alpine

# Create app directory
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

# Env and User
USER node
COPY --chown=node:node . .

# Install dependencies, in development mode as we need dev dependencies
ENV NODE_ENV=development
RUN corepack enable && pnpm install --frozen-lockfile

# Generate build and migrate to latest database schema
ENV NODE_ENV=production
ENV CONTAINER=docker
RUN pnpm run build

# Remove source code and dev dependencies
RUN rm -r src
RUN pnpm prune --prod

# Exports
EXPOSE 8101
CMD ["/bin/sh", "entrypoint.sh"]
