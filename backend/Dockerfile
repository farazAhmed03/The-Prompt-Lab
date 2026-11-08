FROM node:20-alpine
WORKDIR /app
RUN mkdir -p /app/data && chown -R node:node /app
COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY --chown=node:node config ./config
COPY --chown=node:node controllers ./controllers
COPY --chown=node:node middleware ./middleware
COPY --chown=node:node models ./models
COPY --chown=node:node routes ./routes
COPY --chown=node:node utils ./utils
COPY --chown=node:node data ./data
COPY --chown=node:node server.js ./
USER node
EXPOSE 5000
CMD ["node", "server.js"]
