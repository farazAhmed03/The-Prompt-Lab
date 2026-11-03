FROM node:20-alpine
WORKDIR /app
RUN mkdir -p /app/data && chown -R node:node /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --chown=node:node . .
USER node
EXPOSE 5000
CMD ["node", "server.js"]
