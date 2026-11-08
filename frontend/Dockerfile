# =========================================
# Stage 1: Build Stage
# =========================================
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --ignore-scripts
COPY . .
RUN npm run build

# =========================================
# Stage 2: Runtime
# =========================================
FROM nginxinc/nginx-unprivileged:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080 8443
CMD ["nginx", "-g", "daemon off;"]