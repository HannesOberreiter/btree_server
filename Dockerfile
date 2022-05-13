# https://www.digitalocean.com/community/tutorials/how-to-secure-a-containerized-node-js-application-with-nginx-let-s-encrypt-and-docker-compose
# https://www.digitalocean.com/community/tutorials/how-to-build-a-node-js-application-with-docker#step-3-%E2%80%94-writing-the-dockerfile

FROM node:16-alpine

# Create app directory
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app

# Install pm2 globally
RUN npm install pm2 -g

# Env and User
USER node
COPY --chown=node:node . .

# Install dependencies, in development mode as we need dev depencies
ENV NODE_ENV=development
RUN npm ci

# Generate build and migrate to latest database schema
ENV NODE_ENV=production
RUN npm run build
RUN npm run mail

# Remove source code and dev depencies
# https://joshtronic.com/2021/03/21/uninstalling-dev-dependencies-with-npm/
RUN rm -r src mjml
RUN npm prune --production

# Exports
EXPOSE 8101
CMD ["/bin/sh", "entrypoint.sh"]
